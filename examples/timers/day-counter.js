/* global Backendless */

'use strict';

module.exports = Backendless.ServerCode.timer({

  frequency: {
    schedule: 'daily',
    repeat  : { 'every': 1 }
  },

  execute: function() {
    Backendless.Counters.incrementAndGet(this.name);
  }

});
