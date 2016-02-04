'use strict';

module.exports = function(backendless) {

  return backendless.serverCode.timer({
    frequency: {
      schedule: "daily",
      repeat  : {"every": 1}
    },

    execute: function() {
      console.log("Timer tick");
    }
  });
};
