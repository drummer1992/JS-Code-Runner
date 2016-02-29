'use strict';

global.Backendless = require('backendless');
global.Backendless.ServerCode = require('./server-code/api');

exports.debug = function(opts) {
  return require('./server-code/runners/debug').start(opts);
};

exports.cloud = function(opts) {
  return require('./server-code/runners/cloud').start(opts);
};

exports.deploy = function(opts) {
  return require('./server-code/publisher').publish(opts);
};