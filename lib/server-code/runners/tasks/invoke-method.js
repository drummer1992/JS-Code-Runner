'use strict';

const loadServerCode = require('../../loader').load,
      events         = require('../../events'),
      pipe           = require('../../../util/promise').pipe;

function decodeArguments(task) {
  task.arguments = task.arguments && JSON.parse(String.fromCharCode.apply(String, task.arguments)) || [];
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

function invocationResult(err, args) {
  return JSON.stringify({
    ___jsonclass: 'com.backendless.coderunner.commons.protocol.InvocationResult',
    exception   : err,
    arguments   : args
  });
}

function wrapInvocationResults(task) {
  return invocationResult(null, task.arguments);
}

function wrapInvocationError(err) {
  console.log(err.stack);//TODO: delete me when polished
  return invocationResult({
    ___jsonclass    : 'com.backendless.commons.exception.ExceptionWrapper',
    code            : 0,
    exceptionClass  : 'java.lang.Exception',
    exceptionMessage: err.message || err
  });
}

function callHandler(task, model, req, res) {
  return new Promise((resolve, reject) => {
    res.error = reject;
    res.success = function(value) {
      req.context.prematureResult = res.result = value || res.result;
      resolve();
    };

    try {
      const handler = model.getHandler(task.eventId, task.target);

      if (!handler) {
        return reject(`Integrity violation. ServerCodeModel doesn't contain a handler for ${task.eventId}(${task.target}) event`);
      }

      const methodName = task.event.name + (task.async ? 'Async' : '');
      const handlerModule = loadServerCode(handler.provider, model.app);

      if (!handlerModule[methodName]) {
        return reject(`Integrity violation. ${handler.provider} doesn't contain (${methodName}) method`);
      }

      handlerModule[methodName](req, res);
    } catch (e) {
      reject(e);
    }
  });
}

function unwrapArguments(task, model, req, res) {
  req.context = task.arguments[0];

  task.event.args.forEach( (name, index) => {
    const target = name === 'result' ? res : req;
    target[name] = task.arguments[index + 1];
  });
}

function wrapArguments(task, model, req, res) {
  task.event.args.forEach( (name, index) => {
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

/**
 * @param {{eventId:number, target:string, async:boolean, arguments:Array}} task
 * @param {ServerCodeModel} model
 * @returns {Promise.<string>}
 */
module.exports = function(task, model) {
  const req = {}, res = {};

  return pipe([task, model, req, res], [
    resolveEvent,               // transform {task.eventId} into {task.event} object for convenient usage
    decodeArguments,            // decode arguments bytes array into array of objects
    decodeTarget,               // transform {task.target} JSON string to object
    unwrapArguments,            // fill {req/res} objects with {task.arguments} using {EventType.prototype.args} rule
    callHandler,                // load events handler model and invoke event handler method
    wrapArguments,              // collect changes made to {req} and {res} objects back into {task.arguments}
    encodeArguments,            // encode task.arguments array into bytes array
    wrapInvocationResults       // prepare InvocationResult JSON string with arguments
  ]).catch(wrapInvocationError);// prepare InvocationResult JSON string with exception
};