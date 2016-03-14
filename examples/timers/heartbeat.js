/* global Backendless */

'use strict';

Backendless.ServerCode.addTimer({

  frequency: {
    schedule: 'custom',
    repeat  : { every: 60 }
  },

  execute: function() {
    console.log("I'm alive!");

    Backendless.Logging.getLogger('heartbeat').debug("I'm alive!");
  }

});