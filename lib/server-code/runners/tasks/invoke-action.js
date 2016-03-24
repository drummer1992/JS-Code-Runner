'use strict';

const logger          = require('../../../util/logger'),
      file            = require('../../../util/file'),
      ServerCodeModel = require('../../model');

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
 * @returns {String} ServerCodeModel JSON
 */
function analyseServerCode(task) {
  const files = file.expand([`${task.codePath}/**`], { nodir: true });

  return JSON.stringify(ServerCodeModel.build(task.codePath, files));
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
 * @returns {*} Task Execution Result
 */
module.exports = function(task) {
  const action = actions[task.actionType];

  if (!action) {
    throw new Error(`Unknown action type: [${task.actionType}]`);
  }

  return action(task);
};