/* eslint no-console:0 */

/**
 * Logging tool for Backendless CodeRunner
 * @module util/logger
 */

'use strict';

const util = require('util');
const silent = process.env.NODE_ENV === 'test';

function zeroPad(n, size) {
  n = n.toString();

  while (n.length < size) {
    n = `0${n}`;
  }

  return n;
}

// 16:19:34.754
function timestamp() {
  const d = new Date();

  const time = [
    zeroPad(d.getHours(), 2),
    zeroPad(d.getMinutes(), 2),
    zeroPad(d.getSeconds(), 2)
  ].join(':');

  return [time, zeroPad(d.getMilliseconds(), 3)].join('.');
}

const logger = {};
logger.verbose = false;

logger.info = logger.log = function() {
  if (!silent) {
    console.log.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
  }
};

logger.error = function() {
  if (!silent) {
    console.error.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
  }
};

logger.debug = function() {
  if (logger.verbose) {
    logger.log.apply(logger, arguments);
  }
};

module.exports = logger;