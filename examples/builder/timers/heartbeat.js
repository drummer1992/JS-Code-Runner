'use strict';

var CodeRunner = require('../../../lib');

module.exports = CodeRunner.timer({
  name: "Heartbeat",

  frequency: {
    schedule: "once"
  },

  tick: function() {
    console.log("I'm alive!");
  }
});
