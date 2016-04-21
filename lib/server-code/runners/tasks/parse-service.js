'use strict';

const logger          = require('../../../util/logger'),
      file            = require('../../../util/file'),
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

  const serviceFolder = `${task.codePath}/${task.argObject.fileName}`;
  const files = file.expand([`${serviceFolder}/**`], { nodir: true });
  const model = ServerCodeModel.build(task.codePath, files);

  if (model.errors.length) {
    throw new Error(model.errors[0].message);
  }

  return model.services.values().map(service => {
    return {
      name          : service.name,
      version       : service.version,
      description   : service.description,
      configuration : service.configItems,
      xmlDescription: service.xml()
    };
  });
}

module.exports = parseService;