'use strict'

const path = require('path')
const fs = require('fs')
const logger = require('../util/logger')
const utils = require('./utils')

const CONFIG_FILE = './coderunner.json'

module.exports = function getOptionsFromConfigurationFile(file) {
  return utils.mergeObjects(readFile(file), require('./defaults.json'))
}

function readFile(file) {
  if (!file) {
    file = fs.existsSync(CONFIG_FILE)
      ? CONFIG_FILE
      : `${__dirname}/../../bin/${CONFIG_FILE}`
  }

  file = path.resolve(file)

  logger.debug(`Using configuration stored in ${file} `)

  try {
    return require(file)
  } catch (e) {
    logger.error(`Warning. Unable to read config file [${file}]`)

    throw e
  }
}
