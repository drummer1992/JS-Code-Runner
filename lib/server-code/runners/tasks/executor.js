'use strict';

const wrapper = require('./util/result-wrapper');

const executors = {
  ['com.backendless.coderunner.commons.protocol.RequestMethodInvocation'] : './invoke-method',
  ['com.backendless.coderunner.commons.protocol.RequestActionInvocation'] : './invoke-action',
  ['com.backendless.coderunner.commons.protocol.RequestServiceInvocation']: './invoke-service'
};

const executor = module.exports = {};

function invocationResult(err, result) {
  return JSON.stringify(wrapper.invocationResult(err, result));
}

function getTaskExecutor(task) {
  const taskClass = task.___jsonclass;

  if (!executors[taskClass]) {
    throw new Error(`Unknown task [${taskClass}]`);
  }

  return require(executors[taskClass])
}

/**
 * @param {RequestMethodInvocation|RequestServiceInvocation|RequestActionInvocation} task
 * @param {Object} runnerOpts
 * @param {?ServerCodeModel} model
 * @returns {Promise.<string>} InvocationResult JSON string
 */
executor.execute = function(task, runnerOpts, model) {

  return Promise.resolve()
    .then(() => getTaskExecutor(task))
    .then((taskExecutor) => taskExecutor(task, runnerOpts, model))
    .then(result => result && invocationResult(null, result))
    .catch(invocationResult);
};