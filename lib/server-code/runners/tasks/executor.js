'use strict';

const executors = {
  ['com.backendless.coderunner.commons.protocol.RequestMethodInvocation'] : require('./invoke-method'),
  ['com.backendless.coderunner.commons.protocol.RequestActionInvocation'] : require('./invoke-action'),
  ['com.backendless.coderunner.commons.protocol.RequestServiceInvocation']: require('./invoke-service')
};

const executor = {};

executor.execute = function(task, model) {
  const taskClass = task.___jsonclass;
  const taskExecutor = executors[taskClass];

  if (taskExecutor) {
    return taskExecutor(task, model);
  }

  return Promise.reject(`Unknown task [${taskClass}]`);
};

module.exports = executor;