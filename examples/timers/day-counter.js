'use strict';

module.exports = function(backendless) {

  return backendless.serverCode.timer({
    name: "Day_Counter",

    frequency: {
      schedule: "daily",
      repeat  : {"every": 1}
    },

    execute: function() {
      backendless.api.Counters.incrementAndGet(this.name);
    }
  });
};
