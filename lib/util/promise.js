'use strict';

const Backendless = require('backendless');

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent version that returns a promise.
 * An analogue to the Q.denodeify
 *
 * @param {function} fn
 * @param {Object} context
 *
 * @returns {function}
 */
exports.promisifyNode = function(fn, context) {
  return function() {
    return new Promise((resolve, reject) => {
      const args = Array.prototype.slice.call(arguments);
      args.push((err, value) => err ? reject(err) : resolve(value));

      fn.apply(context, args);
    });
  };
};

exports.promisifyBackendless = function(fn, context) {
  if (Backendless.promisesEnabled()) {
    return fn.bind(context);
  }
  
  return function() {
    return new Promise((resolve, reject) => {
      const args = Array.prototype.slice.call(arguments);
      args.push(new Backendless.Async(resolve, reject));

      fn.apply(context, args);
    });
  };
};

exports.promiseWhile = function(predicate, action) {
  function loop() {
    return predicate() && Promise.resolve(action()).then(loop);
  }

  return Promise.resolve().then(loop);
};

exports.timeout = function(ms, promise, msg) {
  msg = msg || `Timeout after ${ms} ms`;

  const timeoutRejector = new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error(msg)), ms);
  });

  return Promise.race([promise, timeoutRejector]);
};