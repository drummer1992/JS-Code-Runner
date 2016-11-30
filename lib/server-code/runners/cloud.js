'use strict';

const logger        = require('../../util/logger'),
      DriverService = require('../services/driver'),
      tasksExecutor = require('./tasks/executor'),
      consoleLogger  = require('../../util/console-logger'),
      Backendless   = require('backendless');

const finalize = () => {
  if (Backendless.applicationId) {
    return Backendless.Logging.flush();
  }
};

exports.start = function(opts) {
  logger.info('Starting Cloud Code Runner');

  const driver = new DriverService(opts.driverHost, opts.driverPort, opts.driverRunnerId);

  consoleLogger.attach();

  // In order to minimize the number of API calls we send to Backendless,
  // we set the logging policy to collect at least 50 messages before sending them to server
  // Before exiting, the CLOUD CodeRunner flushes all pending messages to the server anyway
  Backendless.Logging.setLogReportingPolicy(50, 0);

  function getTask() {
    return driver.getRequest(opts.driverRequestId);
  }

  function processTask(task) {
    logger.info(`[${task.id}] Processing started`);

    return tasksExecutor.execute(task, opts)
      .then((result) => {
        logger.info(`[${task.id}] Processing finished`);

        return result && driver.sendResult(task.id, result);
      });
  }

  return getTask()
    .then(processTask)
    .then(finalize);
};