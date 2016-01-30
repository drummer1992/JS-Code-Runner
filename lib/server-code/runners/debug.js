"use strict";

const logger              = require('../../util/logger'),
      promiseWhile        = require('../../util/promise').promiseWhile,
      buildModel          = require('../model').build,
      ServerCodeService   = require('../services/server-code'),
      BackendlessRegistry = require('../services/registry');

const EVENTS_WAIT_TIMEOUT = 10;

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
          if (result === 1) {
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
      .catch(e => {
        logger.error('Error while waiting for events: ' + e);
        throw e;
      });
  }

  processTask(task) {
    logger.info('Bingo ! Got some work to do !!');

    if (task && task.length === 2) {
      let appId = task[0];
      task = JSON.parse(task[1]);

      console.log(appId);
      console.log(task);

      //TODO: analyse task, load the task handler, invoke it and put the response (if any) back to the Redis
    }
  }
}

exports.start = function(opts) {
  logger.info('Starting Debug Code Runner...');

  return new DebugCodeRunner(opts).start();
};