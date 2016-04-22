'use strict';

const logger          = require('../../../util/logger'),
      file            = require('../../../util/file'),
      argsUtil        = require('./util/args'),
      ServerCodeModel = require('../../model');

/**
 * @typedef {Object} CustomServiceParserArgs
 * @property {String} fileName
 * @property {String} fileType
 */

/**
 * @param {InvokeActionTask} task
 * @param {CustomServiceParserArgs} task.argObject
 * @returns {Array.<Object>}
 */
function parseService(task) {
  logger.debug(`PARSE SERVICE TASK: ${JSON.stringify(task)}`);

  const files = file.expand([`${task.codePath}/**`], { nodir: true });
  const model = ServerCodeModel.build(task.codePath, files);

  if (model.errors.length) {
    throw new Error(model.errors[0].message);
  }

  return argsUtil.encode(model.services.values().map(service => {
    return {
      //TODO: temporary commented due to server unpreparedness
      // name          : service.name,
      // version       : service.version,
      // description   : service.description,
      config: service.configItems.map(item => Object.assign({
        ___jsonclass: 'com.backendless.marketplace.model.BlConfigurationItemDescription',
        options: item.options && item.options.join(',')
      }, item)),
      xml   : service.xml()
    };
  }));
}

module.exports = parseService;