"use strict";

const path = require('path');
const fs = require('fs');
const logger = require('./util/logger');
const CONFIG_FILE = './coderunner.json';

function mergeOpts(config, opts) {
  config.app || (config.app = {});

  opts.appId && (config.app.id = opts.appId);
  opts.appKey && (config.app.secretKey = opts.appKey);
  opts.appVersion && (config.app.version = opts.appVersion);
}

function loadConfigFile(file) {
  var result;

  if (file) {
    file = path.resolve(file);
  } else if (fs.existsSync(CONFIG_FILE)) {
    file = CONFIG_FILE;
  } else {
    const binFolder = path.resolve(__dirname + '/../bin');
    file = path.join(binFolder, CONFIG_FILE);
  }

  try {
    result = require(file);
  } catch (ex) {
    logger.error(ex.stack);

    result = {};
  }

  return Promise.resolve(result);
}

exports.read = function(opts) {
  return loadConfigFile(opts.config)
    .then(config => mergeOpts(config, opts));
};