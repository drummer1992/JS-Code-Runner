'use strict';

module.exports = function(backendless) {

  return backendless.serverCode.timer({
    name: "Heartbeat",

    frequency: {
      schedule: "once"
    },

    execute: function() {
      console.log("I'm alive!");
    }
  });

};