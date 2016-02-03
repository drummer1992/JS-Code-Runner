"use strict";

/**
 * Wraps a NodeJS continuation passing function and returns an equivalent version that returns a promise.
 * An analogue to the Q.denodeify
 */
exports.denodeify = function(fn, context) {
  return function() {
    return new Promise((resolve, reject)=> {
      var args = Array.prototype.slice.call(arguments);
      args.push((err, value)=> err ? reject(err) : resolve(value));

      fn.apply(context, args);
    })
  }
};

exports.promiseWhile = function(predicate, action) {
  function loop() {
    if (!predicate()) return;

    return Promise.resolve(action()).then(loop);
  }

  return Promise.resolve().then(loop);
};

/**
 * Sequential call a list of functions passing them same set of arguments
 * If one of chain functions return a Promise the next one in chain is called when it's fulfilled
 *
 * @param {Function[]} args
 * @param {Function[]} chain
 * @returns {Promise.<*>}
 */
exports.pipe = function(args, chain) {
  let result = Promise.resolve();

  chain.forEach(fn => {
    result = result.then(() => fn.apply(null, args));
  });

  return result;
};