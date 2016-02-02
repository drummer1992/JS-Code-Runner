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

exports.pipe = function(args, chain) {
  let result = Promise.resolve();

  chain.forEach(fn => {
    result = result.then(() => {
      let p = fn.apply(null, args);

      return p;
    });
  });

  return result;
};