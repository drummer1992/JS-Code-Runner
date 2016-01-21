'use strict';

let Handler = require('./handler');
let Timer = require('./timer');
let Service = require('./service');

exports.handler = function(service, target, handles) {
  return new Handler(service, target, handles);
};

exports.persistenceEventsHandler = function(target, handles) {
  return new Handler('persistence', target, handles);
};

exports.handler.sync = Handler.sync;

exports.timer = function(/* to be defined*/) {
  return new Timer();
};

exports.service = function(/* to be defined*/) {
  return new Service();
};