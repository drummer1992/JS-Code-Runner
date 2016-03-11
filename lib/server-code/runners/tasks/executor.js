'use strict';

const wrapper = require('./util/result-wrapper'),
    Backendless = require('backendless');

const executors = {
    ['com.backendless.coderunner.commons.protocol.RequestMethodInvocation']: './invoke-method',
    ['com.backendless.coderunner.commons.protocol.RequestActionInvocation']: './invoke-action',
    ['com.backendless.coderunner.commons.protocol.RequestServiceInvocation']: './invoke-service'
};

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
 */

const executor = module.exports = {};

/**
 * @param {?Error|ExceptionWrapper|String} err
 * @param {*} result
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

    return require(executors[taskClass])
}

/**
 * @param {CodeRunnerTask} task
 */
function initClientSdk(task) {
    Backendless.serverURL = task.initAppData.url;
    Backendless.initApp(task.applicationId, task.initAppData.secretKey, task.initAppData.appVersionName);
}

/**
 * @param {CodeRunnerTask} task
 * @param {Object} runnerOpts
 * @param {?ServerCodeModel} model
 * @returns {Promise.<string>} InvocationResult JSON string
 */
executor.execute = function (task, runnerOpts, model) {

    return Promise.resolve()
        .then(() => initClientSdk(task))
        .then(() => getTaskExecutor(task))
        .then((taskExecutor) => taskExecutor(task, runnerOpts, model))
        .then(result => result && invocationResult(null, result))
        .catch(invocationResult);
};