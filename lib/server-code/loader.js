'use strict';

const ServerCode = require('./api'),
      path       = require('path'),
      logger     = require('../util/logger');

exports.load = function(file) {
  const resolved = path.resolve(file);

  logger.debug(`[${file}] resolved to [${resolved}]`);

  const module = require(resolved);

  if ((module && module.prototype || module) instanceof ServerCode) {
    return module;
  }

  throw new Error('Not a Server Code file');
};