'use strict';

const events = require('../../events'),
      domain = require('domain');

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
 * String Bytes Array in Unicode -> JSON -> Array of objects -> Array of transformed objects according to classMappings
 *
 * @param {Array<number>} args
 * @param classMappings
 * @returns {Array<*>}
 */
function decodeTaskArguments(args, classMappings) {

  function transformObjectClass(obj) {
    if (obj && typeof obj === 'object') {
      if (obj.___class && classMappings[obj.___class]) {
        obj = Object.assign(new classMappings[obj.___class](), obj);
      }

      Object.keys(obj).forEach(key => {
        obj[key] = transformObjectClass(obj[key]);
      })
    }

    return obj;
  }

  return (args && args.length && JSON.parse(bytes2str(args)) || []).map(transformObjectClass);
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
  req.context = args[0] || {};

  fields.forEach((name, index) => {
    var arg = args[index + 1];

    if (name === 'result') {
      res.error = arg && arg.exception;
      res.result = arg && arg.result;
    } else {
      req[name] = arg;
    }
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
    args[index + 1] = (name === 'result')
      ? executionResult(res.error, res.result)
      : req[name];
  });
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
  const req = {}, res = {};
  const async = task.async;

  return new Promise((resolve, reject) => {
    const taskArgs = decodeTaskArguments(task.arguments, model.classMappings);
    const event = events.get(task.eventId);

    if (!event) {
      throw new Error(`Integrity violation. Unknown event id: [${task.eventId}]`);
    }

    // fill {req/res} objects with {task.arguments} using {EventType.prototype.args} rules
    unwrapArguments(taskArgs, event.args, req, res);

    if (!async) {
      let timeoutTimer;
      let timed = function(fn) {
        return value => {
          if (timeoutTimer) {
            clearTimeout(timeoutTimer);
            fn(value);
          }
        };
      };

      res.sendError = timed(err => {
        reject(err || res.error || 'Rejected by Server Code');
      });

      res.sendSuccess = timed(value => {
        res.error = null; //since success is called we ignore server error and return the result
        req.context.prematureResult = res.result = value || res.result;

        // collect changes made to {req} and {res} objects and put them back to {taskArgs}
        wrapArguments(taskArgs, event.args, req, res);

        resolve(invocationResult(null, encodeTaskArguments(taskArgs)));
      });

      timeoutTimer = setTimeout(() => {
        timeoutTimer = null;
        reject('Task execution aborted due to timeout');
      }, task.timeout);
    }

    var d = domain.create();
    d.on('error', reject);
    d.run(() => {
      model.invokeEventHandler(task.eventId, fixTargetJSON(task.target), req, res)
    });

    async && resolve(); //empty invocation result for async events
  }).catch(invocationResult);
};