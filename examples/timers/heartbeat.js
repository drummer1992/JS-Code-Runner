/* global Backendless */

'use strict';

module.exports = Backendless.ServerCode.timer({

  frequency: {
    schedule: 'custom',
    repeat  : { every: 160 }
  },

  execute: function() {
    Backendless.Logging.getLogger('heartbeat').debug('I\'m alive!');
  }

});