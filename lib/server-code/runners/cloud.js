'use strict';

const logger        = require('../../util/logger'),
      DriverService = require('../services/driver'),
      tasksExecutor = require('./tasks/executor');

exports.start = function(opts) {
  logger.info('Starting Cloud Code Runner');

  const driver = new DriverService(opts.driverHost, opts.driverPort, opts.driverRunnerId);

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

  return getTask().then(processTask);
};