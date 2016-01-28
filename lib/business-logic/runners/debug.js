"use strict";

const logger              = require('../../util/logger'),
      file                = require('../../util/file'),
      buildModel          = require('../model'),
      BackendlessRegistry = require('../../services/registry'),
      ServerCode          = require('../../services/server-code');

class DebugCodeRunner {
  constructor(opts) {
    this.options = opts;
  }

  start() {
    logger.info('Starting Debug Code Runner...');

    Promise.resolve()
      .then(() => this.buildModel)
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

  buildModel() {
    const appFiles = file.expand(this.options.app.files, {nodir: true});

    this.model = buildModel(appFiles, this.options);
  }

  stop() {
    logger.debug('Shutting down JobTracker');

    if (this.sessionRenewalTimer) {
      clearInterval(this.sessionRenewalTimer);
      delete this.sessionRenewalTimer;
    }

    if (this.debugSessionId) {
      ServerCode.unregisterRunner();
    }

    this.registry && this.registry.stop();
  }

  registerModel() {
    return ServerCode.registerModel(this.model);
  }

  registerRunner() {
    return ServerCode.registerRunner()
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
      this.registry.expire(this.debugSessionId, 60)
        //TODO: will node-redis emulate the error when redis returns 0 ? Should we treat it as error manually ?
        .then(this.keepDebugSessionAlive)
        .catch(err => {
          logger.error(err.message || err);
          logger.error('Oops.. Looks like we were disconnected. Trying to reconnect..');

          delete this.sessionRenewalTimer;
          this.registerRunner();
        })
    }, 45);
  }

  listenTasksChannel() {
    /** TODO:
     *
     * - listen {applicationId} events channel in Redis
     *   - when task arrives
     *     - get the handler, execute it and put the response to Redis
     */
  }
}

exports.start = function(opts) {
  return new DebugCodeRunner(opts).start();
};