"use strict";

const logger       = require('../util/logger'),
      file         = require('../util/file'),
      EventHandler = require('../api/handler'),
      Timer        = require('../api/timer'),
      moduleLoader = require('./module-loader');

function analyzeModule(module) {
  var handlers = [];

  function addHandlers(file, handler) {
    //TODO: analyse handler
    logger.info('Event Handler discovered in ' + file);
  }

  function addTimer(file, timer) {
    //TODO: analyse timer
    logger.info('Timer discovered in ' + file);
  }

  if (module instanceof EventHandler) {
    addHandlers(file, module);
  } else if (module instanceof Timer) {
    addTimer(file, module);
  }

  return handlers;
}

function collectHandlers(files) {
  return new Promise(function(resolve, reject) {
    if (!files.length) {
      return reject('Business logic not found');
    }

    var handlers = [];
    var processed = 0;

    files.forEach(file => {
      logger.info('Processing ' + file);

      var module = moduleLoader.load(file);
      handlers = handlers.concat(analyzeModule(module.exports));

      processed++;

      if (processed === files.length) {
        resolve(handlers);
      }
    });
  });
}

exports.build = function(opts) {
  logger.info('Building Model');

  return collectHandlers(file.expand(opts.app.files, {nodir: true}))
    .then(handlers => {
      return {
        applicationId: opts.app.id,
        appVersionId : opts.app.version,
        handlers     : handlers
      };
    });
};