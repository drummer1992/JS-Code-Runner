'use strict';

module.exports = {
  'type': 'timer',

  name: "Heartbeat",

  frequency: {
    schedule: "once"
  },

  tick: function() {
    console.log("I'm alive!");
  }
};