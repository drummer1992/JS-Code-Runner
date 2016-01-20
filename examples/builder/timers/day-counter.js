'use strict';

var CodeRunner = require('../../../lib');
var Backendless = require('../../backendless');

module.exports = CodeRunner.timer({
  name: "Day_Counter",

  frequency: {
    schedule: "daily",
    repeat  : {"every": 1}
  },

  tick: function() {
    Backendless.Counters.incrementAndGet(this.name);
  }
});
