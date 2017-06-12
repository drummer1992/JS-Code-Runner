'use strict';

const ServerCodeModel = require('../../model'),
      logger          = require('../../../util/logger');

/**
 * @param {InvokeActionTask} task
 * @returns {ServerCodeModel}
 */
function analyseServerCode(task) {
  logger.info(`[ANALYSE CODE] codePath: ${task.codePath}`);

  const model = ServerCodeModel.build(task.codePath);
  model.print();

  return model.toServerModel();
}

module.exports = analyseServerCode;