'use strict';

const cloud = require('./cloud');

module.exports = opts => cloud({
  ...opts,
  sandbox: false
});
