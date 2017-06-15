'use strict';

const file            = require('../../../util/file'),
      ServerCodeModel = require('../../model');

/**
 * @param {InvokeActionTask} task
 * @returns {ServerCodeModel}
 */
function analyseServerCode(task) {
  const files = file.expand([`${task.codePath}/**`], { nodir: true });

  return ServerCodeModel.build(task.codePath, files);
}

module.exports = analyseServerCode;