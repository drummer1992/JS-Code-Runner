'use strict';

require('backendless').ServerCode = require('./server-code/api');

exports.debug = function() {
  return require('./server-code/runners/debug');
};

exports.pro = function() {
  return require('./server-code/runners/pro');
};

exports.cloud = function() {
  return require('./server-code/runners/cloud');
};

exports.deploy = function(opts) {
  return require('./server-code/publisher').publish(opts);
};