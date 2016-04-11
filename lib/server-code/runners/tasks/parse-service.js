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
 * @returns {Object}
 */
function parseService(task) {
  logger.debug(`PARSE SERVICE TASK: ${JSON.stringify(task)}`);

  //TODO: workaround for BKNDLSS-12155
  const serviceFolder = `${task.codePath}/files/servercode/services${task.argObject.fileName}.${task.argObject.fileType}`;
  const files = file.expand([`${serviceFolder}/**`], { nodir: true });
  const model = ServerCodeModel.build(task.codePath, files);

  return model.services.map(service => {
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