"use strict";

const logger = require('../util/logger'),
      file   = require('../util/file'),
      script = require('./script');

function analyseFiles(files) {
  let handlersMap = {};
  let errors = [];

  function addHandlers(handlers) {
    handlers.forEach(handler => handlersMap[handler.id] = handler);
  }

  function addError(err) {
    errors.push(err);
  }

  function wrapResults() {
    let handlers = Object.keys(handlersMap).map(key => handlersMap[key]);

    return {handlers, errors};
  }

  return Promise
    .all(files.map(file => script.analyse(file).then(addHandlers, addError)))
    .then(wrapResults);
}

exports.build = function build(opts) {
  logger.info('Building Model..');

  let appFiles = file.expand(opts.app.files, {nodir: true});

  return analyseFiles(appFiles)
    .then(function(result) {
      let timers = result.handlers.filter(handler => handler.isTimer).length;
      let handlers = result.handlers.length - timers;
      let errors = result.errors.length;

      if (handlers || timers) {
        logger.info(`Model Build completed: event handlers: ${handlers}, timers: ${timers}, errors: ${errors}`);

        return {
          applicationId: opts.app.id,
          appVersionId : opts.app.version,
          handlers     : result.handlers
        };
      }

      throw new Error('No valid Business Logic found');
    });
};