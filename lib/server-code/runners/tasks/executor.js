'use strict';

const executors = {
  ['com.backendless.coderunner.commons.protocol.RequestMethodInvocation'] : require('./invoke-method'),
  ['com.backendless.coderunner.commons.protocol.RequestActionInvocation'] : require('./invoke-action'),
  ['com.backendless.coderunner.commons.protocol.RequestServiceInvocation']: require('./invoke-service')
};

const executor = {};

executor.execute = function(task, model) {
  const taskClass = task.___jsonclass;
  const executor = executors[taskClass];

  if (executor) {
    return executor(task, model);
  }

  throw new Error(`Unknown task [${taskClass}]`);
};

module.exports = executor;