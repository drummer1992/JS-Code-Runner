'use strict';

var CodeRunner = require('../../lib');

module.exports = CodeRunner.timer({
  name: "Fixture Timer",

  frequency: {
    schedule: "once"
  },

  tick: function() {
    console.log("Timer tick");
  }
});