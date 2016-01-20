'use strict';

var Backendless = require('../../backendless');

module.exports = {
  type: 'timer',

  name: "Day_Counter",

  frequency: {
    schedule: "daily",
    repeat  : {"every": 1}
  },

  tick: function() {
    Backendless.Counters.incrementAndGet(this.name);
  }
};
