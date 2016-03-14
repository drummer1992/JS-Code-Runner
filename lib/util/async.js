'use strict';

module.exports = function async(makeGenerator) {
  return function () {
    const generator = makeGenerator.apply(this, arguments);

    /**
     * @param {{done: boolean, value: ?}} result
     * @returns {Promise.<?>}
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
      return handle(generator.next());
    } catch (ex) {
      return Promise.reject(ex);
    }
  };
};