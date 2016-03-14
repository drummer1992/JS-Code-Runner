/* eslint no-console:0 */

/**
 * Logging tool for Backendless CodeRunner
 * @module util/logger
 */
'use strict';

const util = require('util');

function timestamp() {
  return new Date().toISOString();
}

let verboseMode = false;

const logger = module.exports = {};

logger.info = logger.log = function() {
  console.log.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
};

logger.error = function() {
  console.error.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
};

logger.verbose = function(value) {
  if (arguments.length === 1) {
    verboseMode = !!value;
  }

  return verboseMode;
};

logger.debug = function() {
  if (verboseMode) {
    logger.log.apply(logger, arguments);
  }
};