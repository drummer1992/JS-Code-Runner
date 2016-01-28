'use strict';

module.exports = function(backendless) {

  return backendless.serverCode.persistanceEventsHandler('Order', {
    beforeRemove() {
      console.log('Before Order Remove');
    },

    afterRemove() {
      console.log('After Order Remove');
    }
  });

};
