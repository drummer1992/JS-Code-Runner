'use strict';

const logger          = require('../../../util/logger'),
      file            = require('../../../util/file'),
      ServerCodeModel = require('../../model'),
      path            = require('path');

/**
 * @param {InvokeActionTask} task
 */
function parseService(task) {
  logger.debug(`PARSE SERVICE TASK: ${JSON.stringify(task)}`);

  //TODO: implement me

  throw new Error('Not implemented yet');
}

/**
 * @param {InvokeActionTask} task
 * @param {Object} runnerOpts
 *
 * @returns {String} ServerCodeModel JSON
 */
function analyseServerCode(task, runnerOpts) {
  const codePath = path.resolve(`${runnerOpts.repoPath}}/${task.relativePath}`);

  const files = file.expand([`${codePath}/**`], { nodir: true });

  return JSON.stringify(ServerCodeModel.build(codePath, files));
}

function shutdown() {
  logger.info('Received a shutdown request from Backendless');
  process.exit(0);
}

const actions = {
  PARSE_CUSTOM_SERVICE_FROM_JAR: parseService,
  ANALYSE_SERVER_CODE          : analyseServerCode,
  SHUTDOWN                     : shutdown
};

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
module.exports = function(task, runnerOpts) {
  const action = actions[task.actionType];

  if (!action) {
    throw new Error(`Unknown action type: [${task.actionType}]`);
  }

  return action(task, runnerOpts);
};