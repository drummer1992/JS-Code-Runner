'use strict';

const logger          = require('../../../util/logger'),
      file            = require('../../../util/file'),
      ServerCodeModel = require('../../model'),
      path            = require('path');

const PARSE_SERVICE = 'PARSE_CUSTOM_SERVICE_FROM_JAR';
const VALIDATE_SERVER_CODE = 'VALIDATE_SERVER_CODE';

/**
 * @typedef {CodeRunnerTask} InvokeActionTask
 * @property {String} actionType
 * @property {Object} argObject
 */

/**
 * @param {InvokeActionTask} task
 * @param {Object} runnerOpts
 * @returns {*} Task Execution Result
 */
module.exports = function(task, runnerOpts) { //
  switch (task.actionType) {
    case(PARSE_SERVICE):
      return parseService(task);

    case(VALIDATE_SERVER_CODE):
      return validateServerCode(task, runnerOpts);

    default:
      throw new Error(`Unknown action type: [${task.actionType}]`);
  }
};

/**
 * @param {InvokeActionTask} task
 */
function parseService(task) {
  logger.debug(`PARSE SERVICE TASK: ${JSON.stringify(task)}`);

  //TODO: implement me

  throw new Error('Not implemented yet');
}

function validateServerCode(task, runnerOpts) {
  const codePath = path.resolve(`${runnerOpts.repoPath}}/${task.relativePath}`);

  const files = file.expand([`${codePath}/**`], { nodir: true });

  return JSON.stringify(ServerCodeModel.build(codePath, files));
}