'use strict';

/**
 * @param {function(...): !Generator.<?>} makeGenerator
 * @return {function(...): Promise.<?>}
 */
module.exports = function async(makeGenerator) {
  return function () {
    const generator = makeGenerator.apply(this, arguments);

    /**
     * @param {{done: boolean, value: ?}} result
     * @return {Promise.<?>}
     */
    function handle(result){
      if (result.done) {
        return Promise.resolve(result.value);
      }

      return Promise.resolve(result.value).then(function(res) {
        return handle(generator.next(res));
      }, function(err){
        return handle(generator.throw(err));
      });
    }

    try {
      let result = generator.next();
      return handle(result);
    } catch (ex) {
      return Promise.reject(ex);
    }
  }
};