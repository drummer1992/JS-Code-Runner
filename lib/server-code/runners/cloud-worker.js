'use strict';

const Backendless = require('backendless');
const logger = require('../../util/logger');
const MessagesBroker = require('../services/messages-broker');
const tasksExecutor = require('./tasks/executor');
const consoleLogger = require('../../util/console-logger');
const Chalk = require('chalk');
const TASKS_CHANNEL = 'CODE_RUNNER_DRIVER';

const flushPendingLogs = () => {
  if (Backendless.applicationId) {
    return Backendless.Logging.flush().catch(err => {
      logger.error('Error during logs flushing', err.message || err);
    });
  }
};

module.exports = function(opts) {
  logger.usePid = true;

  consoleLogger.attach();

  const messageBroker = new MessagesBroker(opts.backendless.msgBroker, false);
  messageBroker.on('error', err => {
    logger.error(err);
    process.exit(1);
  });

  const getTask = () => messageBroker.getTask(TASKS_CHANNEL);

  /**
   * @param {CodeRunnerTask} task
   * @returns {Promise.<void>}
   */
  const processTask = task => {
    const time = process.hrtime()

    function sendResult(result) {
      const duration = process.hrtime(time)
      const ms = duration[0] * 1000 + duration[1] / 1e6

      logger.info(`Processing finished in ${Chalk.cyan(ms.toFixed(3))} ms`);

      if (result) {
        logger.debug('Sending results to Redis');

        return messageBroker.setTaskResult(task, result)
          .then(() => logger.debug('Task results sent'));
      }
    }

    return tasksExecutor.execute(task, opts)
      .then(sendResult)
      .catch(err => logger.error(`Error during task execution. ${err.message || err}`));
  };

  return messageBroker.init()
    .then(getTask)
    .then(processTask)
    .then(flushPendingLogs)
    .catch(err => logger.error(err.message))
    .then(() => process.exit());
};