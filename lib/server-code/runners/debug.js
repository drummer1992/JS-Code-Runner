"use strict";

const logger              = require('../../util/logger'),
      promiseWhile        = require('../../util/promise').promiseWhile,
      buildModel          = require('../model').build,
      ServerCodeService   = require('../services/server-code'),
      BackendlessRegistry = require('../services/registry'),
      tasksExecutor       = require('./tasks/executor');

const EVENTS_WAIT_TIMEOUT = 5;

class DebugCodeRunner {
  constructor(opts) {
    this.options = opts;
    this.scs = new ServerCodeService(opts.app, opts.backendless.apiServer);
    this.model = buildModel(opts.app);
  }

  start() {
    Promise.resolve()
      .then(() => this.registerRunner())
      .then(() => this.keepDebugSessionAlive())
      .then(() => this.registerModel())
      .then(() => this.listenTasksChannel())
      .catch(err => {
        logger.error(err.message || err);
        this.stop();
      });

    return this;
  }

  stop() {
    logger.debug('Shutting down Code Runner');

    if (this.sessionRenewalTimer) {
      logger.debug('Stopping Debug Session renewal timer');
      clearInterval(this.sessionRenewalTimer);
      delete this.sessionRenewalTimer;
    }

    if (this.debugSessionId) {
      this.scs.unregisterRunner();
    }

    if (this.registry) {
      logger.debug('Closing Redis connection');

      this.registry.stop();
    }

    this.stopped = true;
  }

  registerModel() {
    return this.scs.registerModel(this.model.serialize());
  }

  registerRunner() {
    return this.scs.registerRunner()
      .then(debugId => (this.debugSessionId = debugId));
  }

  getRegistry() {
    if (!this.registry) {
      const registryOpts = this.options.backendless.registry;

      this.registry = new BackendlessRegistry(registryOpts.host, registryOpts.port);
    }

    return this.registry;
  }

  keepDebugSessionAlive() {
    this.sessionRenewalTimer && clearInterval(this.sessionRenewalTimer);

    this.sessionRenewalTimer = setTimeout(() => {
      logger.debug('Debug Session Renewal tick');

      this.getRegistry().expire(this.debugSessionId, 60)
        .then(result => {
          let keyExists = result === 1;

          if (keyExists) {
            this.keepDebugSessionAlive();
          } else {
            throw new Error("Debug Session ID doesn't exist on server anymore");
          }
        })
        .catch(err => {
          logger.error(err.message || err);
          logger.error('Oops.. Looks like we were disconnected. Trying to reconnect..');

          delete this.sessionRenewalTimer;
          this.start();
        });
    }, 45000);
  }

  listenTasksChannel() {
    logger.info('Waiting for Business Logic tasks..');

    const running = () => !this.stopped;

    promiseWhile(running, () => this.getTask().then(task => task && this.processTask(task)));
  }

  getTask() {
    return this.getRegistry().blpop(this.options.app.id, EVENTS_WAIT_TIMEOUT)
      .then(task => task && task[1] && JSON.parse(task[1]))//TODO: discuss with the backend guys why it's array
      .catch(e => {
        logger.error('Error while waiting for events: ' + e);
        throw e;
      });
  }

  processTask(task) {
    logger.info('Bingo ! Got some work to do !!');

    const registry = this.getRegistry();

    function sendResult(result) {
      logger.debug('Sending task result back to Redis');

      return registry.rpush(task.id, result)
        .then(()=> registry.expire(task.id, 10))
        .then(()=> {
          logger.debug('Task result sent');
        });
    }

    tasksExecutor.execute(task, this.model)
      .then(result => result && sendResult(result))
      .catch(err => {
        logger.error(err.message || err);

        sendResult({
          exception: {
            exceptionMessage: err.message || err
          }
        });
      });
  }
}

exports.start = function(opts) {
  logger.info('Starting Debug Code Runner...');

  return new DebugCodeRunner(opts).start();
};