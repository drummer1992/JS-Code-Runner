"use strict";

module.exports = {
  get debug() {
    return require('./debug');
  },

  get cloud() {
    return require('./cloud');
  }
};