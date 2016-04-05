'use strict';

/**
 * @typedef {Object} ExceptionWrapper
 * @property {String} ___jsonclass
 * @property {String} exceptionClass
 * @property {String} exceptionMessage
 */

/**
 * @param {?Error|ExceptionWrapper|String} err
 * @param {Array<number>} args
 * @returns {Object}
 */
exports.invocationResult = function(err, args) {
  return {
    ___jsonclass: 'com.backendless.coderunner.commons.protocol.InvocationResult',
    arguments   : args || [],
    exception   : err && exports.exception(err)
  };
};

/**
 * @param {?Error|ExceptionWrapper|String} err
 * @returns {Object}
 */
exports.exception = function(err) {
  const errCode = typeof err.code === 'number' ? err.code : 0;
  
  return {
    ___jsonclass    : err.___jsonclass || 'com.backendless.commons.exception.ExceptionWrapper',
    code            : errCode,
    exceptionClass  : err.exceptionClass || 'java.lang.Exception',
    exceptionMessage: err.exceptionMessage || err.message || err
  };
};

/**
 * @param {?Error|ExceptionWrapper|String} err
 * @param {?*=} result
 * @returns {Object}
 */
exports.executionResult = function(err, result) {
  return {
    ___jsonclass: 'com.backendless.servercode.ExecutionResult',
    result      : result,
    exception   : err && exports.exception(err)
  };
};