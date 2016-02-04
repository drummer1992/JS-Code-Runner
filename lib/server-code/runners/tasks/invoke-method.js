'use strict';

const loadServerCode = require('../../loader').load,
      events         = require('../../events'),
      pipe           = require('../../../util/promise').pipe,
      logger         = require('../../../util/logger');

class InvocationResult {
  constructor(err, args) {
    this.err = err || null;
    this.args = args;
  }

  serialize() {
    return {
      ___jsonclass: 'com.backendless.coderunner.commons.protocol.InvocationResult',
      exception   : this.err && {
        ___jsonclass    : 'com.backendless.commons.exception.ExceptionWrapper',
        code            : 0,
        exceptionClass  : 'java.lang.Exception',
        exceptionMessage: this.err.message || this.err
      },
      arguments   : this.args
    }
  }

  toJSON() {
    return JSON.stringify(this.serialize());
  }

  static createSuccess(args) {
    return new InvocationResult(null, args).toJSON();
  }

  static createError(err) {
    return new InvocationResult(err).toJSON();
  }
}

function decodeArguments(task) {
  if (task.arguments && task.arguments.length) {
    task.arguments = JSON.parse(String.fromCharCode.apply(String, task.arguments)) || [];
  }
}

function encodeArguments(task) {
  const s = JSON.stringify(task.arguments);
  const args = task.arguments = [];

  for (var i = 0; i < s.length; ++i) {
    args.push(s.charCodeAt(i));
  }
}

function decodeTarget(task) {
  task.target = task.target && task.target.replace(/'/g, '"'); //TODO: http://bugs.backendless.com/browse/BKNDLSS-11576
}

function callHandler(task, model, req, res) {
  return new Promise((resolve, reject) => {

    if (!task.async) {
      res.error = reject;
      res.success = function(value) {
        req.context.prematureResult = res.result = value || res.result;
        resolve();
      };
    }

    try {
      const handler = model.getHandler(task.eventId, task.target);

      if (!handler) {
        return reject(`Integrity violation. ServerCodeModel doesn't contain a handler for ${task.eventId}(${task.target}) event`);
      }

      const suffix = ((task.async && !handler.timer) ? 'Async' : '');
      const methodName = task.event.name + suffix;
      const handlerModule = loadServerCode(handler.provider, model.app);

      if (!handlerModule[methodName]) {
        return reject(`Integrity violation. ${handler.provider} doesn't contain '${methodName}' method`);
      }

      handlerModule[methodName](req, res);

      task.async && resolve();
    } catch (e) {
      reject(e);
    }
  });
}

function unwrapArguments(task, model, req, res) {
  req.context = task.arguments[0];

  task.event.args.forEach((name, index) => {
    const target = name === 'result' ? res : req;
    target[name] = task.arguments[index + 1];
  });
}

function wrapArguments(task, model, req, res) {
  task.event.args.forEach((name, index) => {
    const source = name === 'result' ? res : req;
    task.arguments[index + 1] = source[name];
  });
}

function resolveEvent(task) {
  task.event = events.get(task.eventId);

  if (!task.event) {
    throw new Error(`Integrity violation. Unknown event identifier: ${task.eventId}`);
  }
}

function prepareResult(task) {
  return InvocationResult.createSuccess(task.arguments);
}

/**
 * @param {{eventId:number, target:string, async:boolean, arguments:Array}} task
 * @param {ServerCodeModel} model
 * @returns {Promise.<string>}
 */
module.exports = function(task, model) {
  const pipeLine = [
    resolveEvent,                    // transform {task.eventId} into {task.event} object for convenient usage
    decodeArguments,                 // decode arguments bytes array into array of objects
    decodeTarget,                    // transform {task.target} JSON string to object
    unwrapArguments,                 // fill {req/res} objects with {task.arguments} using {EventType.prototype.args} rule
    callHandler                      // load events handler model and invoke event handler method
  ];

  if (!task.async) {                 // for sync events :
    pipeLine.push(
      wrapArguments,                 // collect changes made to {req} and {res} objects back into {task.arguments}
      encodeArguments,               // encode task.arguments array into bytes array
      prepareResult                  // prepare InvocationResult JSON string with arguments
    );
  }

  return pipe([task, model, {}, {}], pipeLine)
    .catch(err => {
      if (!task.async) {
        return InvocationResult.createError(err); // prepare InvocationResult JSON string with exception
      }

      console.log(err);//TODO: remove me
      logger.error(`Error during async event (${task.eventId}) processing. ${err.message || err}`);
    });
};