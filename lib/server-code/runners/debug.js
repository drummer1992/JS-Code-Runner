'use strict';

const logger           = require('../../util/logger'),
      promiseWhile     = require('../../util/promise').promiseWhile,
      ApiServerService = require('../services/api-server'),
      MessagesBroker   = require('../services/messages-broker'),
      tasksExecutor    = require('./tasks/executor'),
      ServerCodeModel  = require('../model');

const SESSION_TTL = 60; //60 secs
const SESSION_RENEWAL_INTERVAL = 45000; //45 secs

class DebugCodeRunner {
  constructor(opts) {
    this.options = opts;

    this.apiServer = new ApiServerService(opts.app, opts.backendless.apiServer);

    this.messageBroker = new MessagesBroker(opts.backendless.msgBroker, true);
    this.messageBroker.on('error', (err) => this.stop(err));
  }

  start() {
    logger.info('Starting Debug Code Runner...');

    return Promise.resolve()
      .then(() => this.buildModel())
      .then(() => this.messageBroker.init())
      .then(() => {
        return Promise.resolve()
          .then(() => this.registerRunner())
          .then(() => this.keepDebugSessionAlive())
          .then(() => this.registerHandlers())
          .then(() => this.registerServices())
          .then(() => this.listenTasksChannel())
          .catch(err => this.stop(err));
      });
  }

  buildModel() {
    this.model = ServerCodeModel.build(process.cwd(), this.options.app.exclude);

    if (this.model.isEmpty()) {
      throw new Error('Nothing to Debug');
    }
  }

  stop(err) {
    const stopTasks = [];

    if (!this.stopped) {
      if (err) {
        logger.error(err.message || err);
      }

      if (this.sessionRenewalTimer) {
        clearTimeout(this.sessionRenewalTimer);
      }

      if (this.debugSessionId) {
        stopTasks.push(this.apiServer.unregisterRunner());
      }

      stopTasks.push(this.messageBroker.end());

      this.stopped = true;
    }

    return Promise.all(stopTasks);
  }

  registerHandlers() {
    return this.apiServer.registerModel(this.model);
  }

  registerServices() {
    const services = this.model.services.values();

    if (services.length) {
      return this.apiServer.unregisterDebugServices()
        .then(() => this.apiServer.registerDebugServices(services));
    }
  }

  registerRunner() {
    return this.apiServer.registerRunner()
      .then(debugId => (this.debugSessionId = debugId));
  }

  keepDebugSessionAlive() {
    this.sessionRenewalTimer && clearTimeout(this.sessionRenewalTimer);

    this.sessionRenewalTimer = setTimeout(() => {
      this.messageBroker.expireKey(this.debugSessionId, SESSION_TTL, 'Debug Session ID')
        .then(() => this.keepDebugSessionAlive())
        .catch(err => {
          logger.error(err.message || err);

          if (!this.stopped) {
            logger.error('Oops.. Looks like we were disconnected. Trying to reconnect..');

            this.start();
          }
        });
    }, SESSION_RENEWAL_INTERVAL);
  }

  listenTasksChannel() {
    logger.info('Waiting for Server Code tasks..');

    const tasksQueue = this.options.app.id;
    const running = () => !this.stopped;

    promiseWhile(running, () => this.messageBroker.getTask(tasksQueue)
      .then(task => this.processTask(task))
      .catch(error => logger.error(error.message)));
  }

  processTask(task) {
    const msgBroker = this.messageBroker;

    function taskMsg(msg) {
      return `[${task.id}] ${msg}`;
    }

    function sendResult(result) {
      logger.info(taskMsg('Processing finished'));

      if (result) {
        logger.debug(taskMsg('Sending results to Redis'));

        msgBroker.setTaskResult(task.id, result)
          .then(() => logger.debug(taskMsg('Task results sent')));
      }
    }

    function logError(err) {
      logger.error(taskMsg(`Error during task execution. ${err.message || err}`));
    }

    logger.info(taskMsg('New task arrived!'));

    tasksExecutor.execute(task, this.options, this.model)
      .then(sendResult)
      .catch(logError);
  }
}

module.exports = function(opts) {
  return new DebugCodeRunner(opts);
};