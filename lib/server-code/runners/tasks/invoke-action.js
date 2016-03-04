'use strict';

const logger = require('../../../util/logger');

const PARSE_SERVICE = 'PARSE_CUSTOM_SERVICE_FROM_JAR';

/**
 * @typedef {Object} RequestActionInvocation
 * @property {String} actionType
 */

/**
 * @param {RequestActionInvocation} task
 * @param {Object} runnerOpts
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
module.exports = function(task, runnerOpts, model) {
  switch (task.actionType) {
    case(PARSE_SERVICE):
      return parseService(task, model);
    default:
      return Promise.reject(`Unknown action type: [${task.actionType}]`);
  }
};

/**
 * @param {RequestActionInvocation} task
 * @returns {Promise.<*>}
 */
function parseService(task) {
  logger.debug(`PARSE SERVICE TASK: ${JSON.stringify(task)}`);

  //TODO: implement me

  return Promise.reject('Not implemented yet');
}