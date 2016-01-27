'use strict';

const api          = require('./api'),
      logger       = require('./util/logger'),
      config       = require('./config'),
      serverCode   = require('./services/server-code'),
      jobTracker   = require('./job-tracker'),
      modelBuilder = require('./model/builder');

exports.persistenceEventsHandler = api.EventsHandler.persistence;
exports.fileEventsHandler = api.EventsHandler.file;
exports.geoEventsHandler = api.EventsHandler.geo;
exports.messagingEventsHandler = api.EventsHandler.messaging;
exports.customEventHandler = api.EventsHandler.custom;
exports.mediaEventsHandler = api.EventsHandler.media;
exports.userEventsHandler = api.EventsHandler.user;
exports.timer = api.EventsHandler.timer;

function logError(err) {
  logger.error(err.message || err);

  err.stack && logger.debug(err.stack);
}

exports.debug = function(opts) {
  config.init(opts)
    .then(modelBuilder.build)
    .then(jobTracker.debug.start)
    .catch(logError);
};

exports.cloud = function(opts) {
  config.init(opts)
    .then(jobTracker.cloud.start)
    .catch(logError)
};

exports.deploy = function(opts) {
  config.init(opts)
    .then(modelBuilder.build)
    //.then(serverCode.registerModel) ??
    .then(serverCode.publish)
    .then(()=> process.exit(0))
    .catch(logError);
};