'use strict';

const file            = require('../../../util/file'),
      ServerCodeModel = require('../../model'),
      logger          = require('../../../util/logger');

/**
 * @param {InvokeActionTask} task
 * @returns {ServerCodeModel}
 */
function analyseServerCode(task) {
  logger.info(`[ANALYSE CODE] codePath: ${task.codePath}`);

  const files = file.expand([`${task.codePath}/**`], { nodir: true });

  return ServerCodeModel.build(task.codePath, files);
}

module.exports = analyseServerCode;