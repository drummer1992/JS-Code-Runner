"use strict";

const path   = require('path'),
      fs     = require('fs'),
      logger = require('./util/logger');

const CONFIG_FILE = './coderunner.json';

exports.read = function(file) {
  if (file) {
    file = path.resolve(file);
  } else if (fs.existsSync(CONFIG_FILE)) {
    file = CONFIG_FILE;
  } else {
    const binFolder = path.resolve(__dirname + '/../bin');
    file = path.join(binFolder, CONFIG_FILE);
  }

  logger.debug(`Use ${file} as config file`);

  try {
    return require(file);
  } catch (e) {
    logger.error(`Warning. Unable to read config file [${file}]`);

    throw e;
  }
};