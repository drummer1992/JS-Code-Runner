'use strict';

module.exports = function(Backendless) {

  return Backendless.ServerCode.timer({
    frequency: {
      schedule: "custom",
      repeat  : {every: 160}
    },

    execute: function() {
      console.log("I'm alive!");

      //Backendless.api.Logging.getLogger('heartbeat').debug("I'm alive!");
    }
  });

};