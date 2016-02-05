'use strict';

const events = require('../../events');

function str2bytes(s) {
  const result = [];

  for (var i = 0; i < s.length; ++i) {
    result.push(s.charCodeAt(i));
  }

  return result;
}

function bytes2str(bytes) {
  return String.fromCharCode.apply(String, bytes);
}

/**
 * http://bugs.backendless.com/browse/BKNDLSS-11576
 * TODO: remove me when server is fixed
 * @param {string} target
 * @returns {string}
 */
function fixTargetJSON(target) {
  return target && target.replace(/'/g, '"');
}

/**
 * String Bytes Array in Unicode -> JSON -> Array of objects
 * @param {Array<number>} args
 * @returns {Array<*>}
 */
function decodeTaskArguments(args) {
  return args && args.length && JSON.parse(bytes2str(args)) || [];
}

/**
 * Array of objects -> JSON -> String Bytes Array in Unicode
 * @param {Array<*>} args
 * @returns {Array<number>}
 */
function encodeTaskArguments(args) {
  return str2bytes(JSON.stringify(args));
}

/**
 * Fills {req/res} objects with the values from {args} array using fields array as a rule
 *
 * @param {Array<*>} args
 * @param {Array<string>} fields
 * @param {Object} req
 * @param {Object} res
 */
function unwrapArguments(args, fields, req, res) {
  req.context = args[0];

  fields.forEach((name, index) => {
    const target = name === 'result' ? res : req;
    target[name] = args[index + 1];
  });
}

/**
 * A reverse function to the {@link wrapArguments} fn
 * @param {Array<*>} args
 * @param {Array<string>} fields
 * @param {Object} req
 * @param {Object} res
 */
function wrapArguments(args, fields, req, res) {
  fields.forEach((name, index) => {
    const source = name === 'result' ? res : req;
    args[index + 1] = source[name];
  });
}

/**
 * Creates InvocationResult JSON string
 * @param {Error|*} err
 * @param {Array<number>}args
 * @returns {string}
 */
function invocationResult(err, args) {
  return JSON.stringify({
    ___jsonclass: 'com.backendless.coderunner.commons.protocol.InvocationResult',
    arguments   : args || [],
    exception   : err && {
      ___jsonclass    : 'com.backendless.commons.exception.ExceptionWrapper',
      code            : 0,
      exceptionClass  : 'java.lang.Exception',
      exceptionMessage: err.message || err
    }
  });
}

/**
 * @param {{eventId:number, target:string, async:boolean, arguments:Array}} task
 * @param {ServerCodeModel} model
 * @returns {Promise.<string>}
 */
module.exports = function(task, model) {
  const req = {}, res = {};
  const async = task.async;

  return new Promise((resolve, reject) => {
    const taskArgs = decodeTaskArguments(task.arguments);
    const event = events.get(task.eventId);

    if (!event) {
      throw new Error(`Integrity violation. Unknown event id: [${task.eventId}]`);
    }

    // fill {req/res} objects with {task.arguments} using {EventType.prototype.args} rules
    unwrapArguments(taskArgs, event.args, req, res);

    if (!async) {
      res.error = reject;
      res.success = function(value) {
        req.context.prematureResult = res.result = value || res.result;

        // collect changes made to {req} and {res} objects and put them back to {taskArgs}
        wrapArguments(taskArgs, event.args, req, res);

        resolve(invocationResult(null, encodeTaskArguments(taskArgs)));
      };
    }

    model.invokeEventHandler(task.eventId, fixTargetJSON(task.target), req, res);

    async && resolve(); //empty invocation result for async events
  }).catch(invocationResult);
};