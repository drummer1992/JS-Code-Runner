/* eslint no-console:0 */

/**
 * Logging tool for Backendless CodeRunner
 * @module util/logger
 */
'use strict';

const util = require('util');
const PREFIX = ' [JS_CODERUNNER]';

function timestamp() {
  return new Date().toISOString();
}

function prefix() {
  return logger.prefixed ? PREFIX : '';
}

const logger = {};
logger.prefixed = false;
logger.verbose = false;

logger.info = logger.log = function() {
  console.log.call(this, '%s%s - %s', timestamp(), prefix(), util.format.apply(util, arguments));
};

logger.error = function() {
  console.error.call(this, '%s%s - %s', timestamp(), prefix(), util.format.apply(util, arguments));
};

logger.debug = function() {
  if (logger.verbose) {
    logger.log.apply(logger, arguments);
  }
};

module.exports = logger;