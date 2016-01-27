"use strict";

const path   = require('path'),
      fs     = require('fs'),
      logger = require('./util/logger');

const CONFIG_FILE = './coderunner.json';

function mergeOpts(config, opts) {
  config.app || (config.app = {});

  config.driverUrl = opts.driverUrl;
  config.driverRequestId = opts.driverRequestId;
  config.driverRunnerId = opts.driverRunnerId;
  config.verboseMode = opts.verbose;

  opts.appId && (config.app.id = opts.appId);
  opts.appKey && (config.app.secretKey = opts.appKey);
  opts.appVersion && (config.app.version = opts.appVersion);

  return config;
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

class Config {
  init(opts) {
    return loadConfigFile(opts.config)
      .then(config => mergeOpts(config, opts))
      .then(config => this.params = config);
  }

  get(key) {
    if (!this.params) {
      throw new Error('Config not initialized');
    }

    let tokens = key.split('.');
    let result = this.params[tokens[0]];
    let i = 1;

    while (result && i < tokens.length) {
      result = result[tokens[i]];
      i++;
    }

    return result;
  }
}

module.exports = new Config();