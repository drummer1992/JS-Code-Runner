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

function executeTask(task, model) {
  const taskExecutor = getTaskExecutor(task);

  return taskExecutor(task, model);
}

/**
 * @param {CodeRunnerTask} task
 */
function initClientSdk(task) {
  if (task.initAppData) {
    Backendless.serverURL = task.initAppData.url;
    Backendless.initApp(task.applicationId, task.initAppData.secretKey, task.initAppData.appVersionName);
    Backendless.Logging.setLogReportingPolicy(1, 0);
  }
}

/**
 * @param {CodeRunnerTask} task
 * @param {Object} opts
 */
function enrichTask(task, opts) {
  //TODO: workaround for http://bugs.backendless.com/browse/BKNDLSS-12141
  task.codePath = path.resolve(opts.backendless.repoPath, task.applicationId, task.relativePath || '');

  //TODO: workaround for http://bugs.backendless.com/browse/BKNDLSS-12041
  if (task.___jsonclass === executor.RMI && task.eventId === SHUTDOWN_CODE) {
    task.___jsonclass = executor.RAI;
    task.actionType = SHUTDOWN_ACTION;
  }
}

/**
 * @param {CodeRunnerTask} task
 * @param {?*} result
 * @param {?Error|ExceptionWrapper|String=} error
 * @returns {String} task invocation result in JSON
 */
function wrapResult(task, result, error) {
  error && logger.error(error.message || error);

  return JSON.stringify(
    rsiTask(task)
      //TODO: workaround for http://bugs.backendless.com/browse/BKNDLSS-12140
      ? [error ? wrapper.exception(error) : result]
      : wrapper.invocationResult(error, result)
  );
}

function rsiTask(task) {
  return task.___jsonclass === executor.RSI;
}

/**
 * @param {CodeRunnerTask} task
 * @param {Object} opts
 * @param {ServerCodeModel=} model
 * @returns {Promise.<?string>} task invocation result in JSON (if any)
 */
executor.execute = function(task, opts, model) {
  return Promise.resolve()
    .then(() => enrichTask(task, opts))
    .then(() => initClientSdk(task))
    .then(() => executeTask(task, model))
    .then(res => res && wrapResult(task, res))
    .catch(err => wrapResult(task, null, err));
};

