'use strict';

require('backendless').ServerCode = require('./server-code/api');
require('backendless').Request = require('backendless-request');

exports.debug = function(opts) {
  return require('./server-code/runners/debug')(opts);
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