'use strict';

exports.debug = function(opts) {
  require('./business-logic/runners/debug').start(opts);
};

exports.cloud = function(opts) {
  require('./business-logic/runners/cloud').start(opts);
};

exports.deploy = function(opts) {
  require('./business-logic/publisher').publish(opts);
};