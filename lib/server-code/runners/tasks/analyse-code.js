'use strict';

const ServerCodeModel = require('../../model'),
      logger          = require('../../../util/logger'),
      Chalk           = require('chalk');

/**
 * @param {InvokeActionTask} task
 * @returns {ServerCodeModel}
 */
function analyseServerCode(task) {
  logger.info(`[${Chalk.green('ANALYSE CODE')}] codePath: ${task.codePath}`);

  return ServerCodeModel.build(task.codePath);
}

module.exports = analyseServerCode;