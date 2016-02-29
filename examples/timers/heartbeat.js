/* global Backendless */

'use strict';

module.exports = Backendless.ServerCode.timer({

  frequency: {
    schedule: "custom",
    repeat  : {every: 160}
  },

  execute: function() {
    console.log("I'm alive!");

    Backendless.Logging.getLogger('heartbeat').debug("I'm alive!");
  }

});