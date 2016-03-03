'use strict';

const executors = {
  'com.backendless.coderunner.commons.protocol.RequestMethodInvocation' : './invoke-method',
  'com.backendless.coderunner.commons.protocol.RequestActionInvocation' : './invoke-action',
  'com.backendless.coderunner.commons.protocol.RequestServiceInvocation': './invoke-service'
};

const executor = {};

executor.execute = function(task, model) {
  const taskClass = task.___jsonclass;
  const taskExecutor = require(executors[taskClass]);

  if (taskExecutor) {
    return taskExecutor(task, model);
  }

  return Promise.reject(`Unknown task [${taskClass}]`);
};

module.exports = executor;