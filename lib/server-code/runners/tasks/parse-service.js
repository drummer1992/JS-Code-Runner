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

  function transformConfigItem(item) {
    return Object.assign({}, item, {
      ___jsonclass: 'com.backendless.marketplace.model.BlConfigurationItemDescription',
      options     : item.options && item.options.join(',')
    });
  }

  const result = {
    model   : JSON.stringify(model),
    services: model.services.values().map(service => {
      return {
        name       : service.name,
        version    : service.version,
        description: service.description,
        config     : service.configItems.map(transformConfigItem),
        xml        : service.xml()
      };
    })
  };

  return argsUtil.encode(result);
}

module.exports = parseService;