'use strict';

const api          = require('./api'),
      logger       = require('./util/logger'),
      config       = require('./config'),
      serverCode   = require('./services/server-code'),
      taskRunner   = require('./task-runner'),
      modelBuilder = require('./model/builder');

//---- Temporary code for debugging only. Must be removed before releasing to production.
var handlers = process.listeners('uncaughtException');
process.removeAllListeners('uncaughtException');

process.on('uncaughtException', function(err) {
  logger.error('Unhandled exception! ' + err.message + '/n' + err.stack);
});

handlers.forEach(function(handler) {
  process.on('uncaughtException', handler);
});
//----

exports.persistenceEventsHandler = api.EventsHandler.persistence;
exports.fileEventsHandler = api.EventsHandler.file;
exports.geoEventsHandler = api.EventsHandler.geo;
exports.messagingEventsHandler = api.EventsHandler.messaging;
exports.customEventHandler = api.EventsHandler.custom;
exports.mediaEventsHandler = api.EventsHandler.media;
exports.userEventsHandler = api.EventsHandler.user;
exports.timer = api.EventsHandler.timer;

exports.debug = function(opts) {
  config.init(opts)
    .then(modelBuilder.build)
    .then(serverCode.registerModel)
    .then(serverCode.registerRunner)
    .then(taskRunner.local.handleTasks)
    .catch(err => {
      logger.error(err);
    })
};

exports.deploy = function(opts) {
  config.init(opts)
    .then(modelBuilder.build)
    //.then(serverCode.registerModel) ??
    .then(serverCode.publish)
    .then(()=> process.exit(0))
    .catch(err => {
      logger.error(err.stack || err);//temp
      logger.error(err);
    });
};

exports.cloud = function(opts) {
  config.init(opts)
    .then(serverCode.registerRunner)
    .then(taskRunner.cloud.handleTasks)
};