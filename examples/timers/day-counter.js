'use strict';

module.exports = function(Backendless) {

  return Backendless.ServerCode.timer({
    frequency: {
      schedule: "daily",
      repeat  : {"every": 1}
    },

    execute: function() {
      Backendless.api.Counters.incrementAndGet(this.name);
    }
  });
};
