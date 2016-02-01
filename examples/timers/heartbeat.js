'use strict';

module.exports = function(backendless) {

  return backendless.serverCode.timer({
    frequency: {
      schedule: "custom",
      repeat  : {every: 60}
    },

    execute: function() {
      console.log("I'm alive!");

      backendless.api.Logging.getLogger('heartbeat').debug("I'm alive!");
    }
  });

};