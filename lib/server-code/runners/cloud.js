'use strict';

const logger        = require('../../util/logger'),
      DriverService = require('../services/driver'),
      tasksExecutor = require('./tasks/executor'),
      promisify     = require('../../util/promise').promisifyBackendless,
      Backendless   = require('backendless');

function flushPendingLogs() {
  return promisify(Backendless.Logging.flush, Backendless.Logging)();
}

function finalize() {
  return flushPendingLogs();
}

exports.start = function(opts) {
  logger.debug('Starting Cloud Code Runner');

  const driver = new DriverService(opts.driverHost, opts.driverPort, opts.driverRunnerId);

  function getTask() {
    return driver.getRequest(opts.driverRequestId);
  }

  function processTask(task) {
    logger.debug(`[${task.id}] Processing started`);

    return tasksExecutor.execute(task, opts)
      .then((result) => {
        logger.debug(`[${task.id}] Processing finished`);

        return result && driver.sendResult(task.id, result);
      });
  }

  return getTask()
    .then(processTask)
    .then(finalize);
};