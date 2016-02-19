'use strict';

const domain  = require('domain'),
      events  = require('../../events'),
      json    = require('../../../util/json'),
      promise = require('../../../util/promise');

const TIMEDOUT = 'Task execution aborted due to timeout';

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
 * UTF8 Bytes Array -> JSON -> Array of objects classified according to classMappings
 *
 * @param {Array<number>} args
 * @param {Object} classMappings
 * @returns {Array<*>}
 */
function decodeTaskArguments(args, classMappings) {
  return args && args.length && json.parse(new Buffer(args).toString(), classMappings) || [];
}

/**
 * Array of objects -> JSON -> UTF8 Bytes Array
 *
 * @param {*} args
 * @returns {Array<number>}
 */
function encodeTaskArguments(args) {
  return new Buffer(json.stringify(args)).toJSON().data;
}

function exception(err) {
  return {
    ___jsonclass    : err.___jsonclass || 'com.backendless.commons.exception.ExceptionWrapper',
    code            : err.code || 0,
    exceptionClass  : err.exceptionClass || 'java.lang.Exception',
    exceptionMessage: err.exceptionMessage || err.message || err
  }
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
    exception   : err && exception(err)
  });
}

function executionResult(err, result) {
  return {
    ___jsonclass: 'com.backendless.servercode.ExecutionResult',
    result      : result,
    exception   : err && exception(err)
  };
}

/**
 * @param {{eventId:number, target:string, async:boolean, arguments:Array, timeout:number}} task
 * @param {ServerCodeModel} model
 * @returns {Promise.<string>}
 */
module.exports = function(task, model) {
  return new Promise((resolve, reject) => {
    const event = events.get(task.eventId);

    if (!event) {
      throw new Error(`Integrity violation. Unknown event id: [${task.eventId}]`);
    }

    const taskArgs = decodeTaskArguments(task.arguments, model.classMappings);
    const req = {}, res = {};
    const handlerArgs = [req];

    req.context = taskArgs[0] || {};

    //prepare handler {req}, {res} arguments
    event.args.forEach((name, index) => {
      var arg = taskArgs[index + 1];

      if (name === 'result') {
        res.error = arg && arg.exception;
        res.result = arg && arg.result;

        handlerArgs.push(res);
      } else {
        req[name] = arg;
      }
    });

    function sendResult(result) {
      if (result !== undefined) {
        req.context.prematureResult = res.result = result;
      }

      event.args.forEach((name, index) => {
        taskArgs[index + 1] = (name === 'result')
          ? executionResult(res.error, res.result)
          : req[name];
      });

      resolve(invocationResult(null, encodeTaskArguments(taskArgs)));
    }

    function invoke() {
      const result = model.invokeEventHandler(task.eventId, fixTargetJSON(task.target), handlerArgs);

      if (task.async) {
        resolve(); //empty invocation result for async events
      } else {
        promise.timeout(task.timeout, Promise.resolve(result), TIMEDOUT).then(sendResult, reject);
      }
    }

    var d = domain.create();
    d.on('error', reject);
    d.run(invoke);
  }).catch(invocationResult);
};