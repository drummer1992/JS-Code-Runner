'use strict';

const file            = require('../../../util/file'),
      ServerCodeModel = require('../../model');

/**
 * @param {InvokeActionTask} task
 * @returns {String} ServerCodeModel JSON
 */
function analyseServerCode(task) {
  const files = file.expand([`${task.codePath}/**`], { nodir: true });

  return JSON.stringify(ServerCodeModel.build(task.codePath, files));
}

module.exports = analyseServerCode;