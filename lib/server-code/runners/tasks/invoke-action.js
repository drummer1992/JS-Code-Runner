'use strict';

const logger = require('../../../util/logger');

const PARSE_SERVICE = 'PARSE_CUSTOM_SERVICE_FROM_JAR';

/**
 * @typedef {CodeRunnerTask} InvokeActionTask
 * @property {String} actionType
 * @property {Object} argObject
 */

/**
 * @param {InvokeActionTask} task
 * @param {Object} runnerOpts
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
module.exports = function(task, runnerOpts, model) { // eslint-disable-line no-unused-vars
  switch (task.actionType) {
    case(PARSE_SERVICE):
      return parseService(task);
    default:
      return Promise.reject(`Unknown action type: [${task.actionType}]`);
  }
};

/**
 * @param {InvokeActionTask} task
 * @returns {Promise.<*>}
 */
function parseService(task) {
  logger.debug(`PARSE SERVICE TASK: ${JSON.stringify(task)}`);

  //TODO: implement me

  return Promise.reject('Not implemented yet');
}