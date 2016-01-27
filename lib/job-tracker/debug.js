"use strict";

const logger     = require('../util/logger'),
      registry   = require('./registry'),
      config     = require('../config'),
      ServerCode = require('../services/server-code');

class DebugJobTracker {
  constructor(model) {
    let registryConfig = config.get('backendless.registry');

    this.model = model;
    this.registry = registry.get(registryConfig.host, registryConfig.port);
  }

  start() {
    logger.info('Starting Local JobTracker...');

    this.registerRunner()
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
    logger.debug('Shutting down JobTracker');

    if (this.sessionRenewalTimer) {
      clearInterval(this.sessionRenewalTimer);
      delete this.sessionRenewalTimer;
    }

    if (this.debugSessionId) {
      ServerCode.unregisterRunner();
    }

    this.registry.stop();
  }

  registerModel() {
    return ServerCode.registerModel(this.model);
  }

  registerRunner() {
    return ServerCode.registerRunner()
      .then(debugId => (this.debugSessionId = debugId))
      .then(() => this.addShutdownHook());
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

module.exports = DebugJobTracker;