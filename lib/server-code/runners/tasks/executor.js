'use strict';

const wrapper = require('./util/result-wrapper');
const logger = require('../../../util/logger');
const Backendless = require('backendless');
const path = require('path');

const SHUTDOWN_CODE = 32768;
const SHUTDOWN_ACTION = 'SHUTDOWN';

/**
 * @typedef {Object} InitAppData
 * @property {string} secretKey
 * @property {string} url
 * @property {string} appVersionName
 */

/**
 * @typedef {Object} CodeRunnerTask
 * @property {String} ___jsonclass
 * @property {String} applicationId;
 * @property {String} appVersionId;
 * @property {InitAppData} initAppData;
 * @property {Number} timeout
 * @property {String} relativePath
 * @property {String} codePath
 */

const executor = module.exports = {};

executor.RMI = 'com.backendless.coderunner.commons.protocol.RequestMethodInvocation';
executor.RAI = 'com.backendless.coderunner.commons.protocol.RequestActionInvocation';
executor.RSI = 'com.backendless.coderunner.commons.protocol.RequestServiceInvocation';

const executors = {
  [executor.RMI]: './invoke-handler',
  [executor.RAI]: './invoke-action',
  [executor.RSI]: './invoke-service'
};

/**
 * @param {?Error|ExceptionWrapper|String} err
 * @param {*=} result
 * @returns {String}
 */
function invocationResult(err, result) {
  return JSON.stringify(wrapper.invocationResult(err, result));
}

/**
 * @param {CodeRunnerTask} task
 * @returns {Function} task executor
 */
function getTaskExecutor(task) {
  const taskClass = task.___jsonclass;

  if (!executors[taskClass]) {
    throw new Error(`Unknown task [${taskClass}]`);
  }

  return require(executors[taskClass]);
}

/**
 * @param {CodeRunnerTask} task
 */
function initClientSdk(task) {
  if (task.initAppData) {
    Backendless.serverURL = task.initAppData.url;
    Backendless.initApp(task.applicationId, task.initAppData.secretKey, task.initAppData.appVersionName);
  }
}

/**
 * @param {CodeRunnerTask} task
 * @param {Object} opts
 */
function enrichTask(task, opts) {
  task.codePath = path.resolve(opts.backendless.repoPath, task.applicationId, task.relativePath);

  logger.debug(`Path to application server code resolved as ${task.codePath}`);

  // A temporal workaround for http://bugs.backendless.com/browse/BKNDLSS-12041
  if (task.___jsonclass === executor.RMI && task.eventId === SHUTDOWN_CODE) {
    task.___jsonclass = executor.RAI;
    task.actionType = SHUTDOWN_ACTION;
  }
}

/**
 * @param {CodeRunnerTask} task
 * @param {Object} opts
 * @param {ServerCodeModel=} model
 * @returns {Promise.<string>} InvocationResult JSON string
 */
executor.execute = function(task, opts, model) {
  return Promise.resolve()
    .then(() => enrichTask(task, opts))
    .then(() => initClientSdk(task))
    .then(() => getTaskExecutor(task))
    .then((taskExecutor) => taskExecutor(task, model))
    .then(result => result && invocationResult(null, result))
    .catch((err) => {
      logger.error(err);

      logger.error(err.stack);
      return invocationResult(err);
    });
};

