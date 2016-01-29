"use strict";

const logger              = require('../../util/logger'),
      file                = require('../../util/file'),
      buildModel          = require('../model').build,
      ServerCodeService   = require('../../services/server-code'),
      BackendlessRegistry = require('../../services/registry');

class DebugCodeRunner {
  constructor(opts) {
    this.options = opts;
    this.scs = new ServerCodeService(opts.app, opts.backendless.apiServer);
    this.model = buildModel(opts.app);
  }

  start() {
    logger.info('Starting Debug Code Runner...');

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
      clearInterval(this.sessionRenewalTimer);
      delete this.sessionRenewalTimer;
    }

    if (this.debugSessionId) {
      this.scs.unregisterRunner();
    }

    this.registry && this.registry.stop();
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
      this.getRegistry().expire(this.debugSessionId, 60)
        //TODO: will node-redis emulate the error when redis returns 0 ? Should we treat it as error manually ?
        .then(() => this.keepDebugSessionAlive)
        .catch(err => {
          logger.error(err.message || err);
          logger.error('Oops.. Looks like we were disconnected. Trying to reconnect..');

          delete this.sessionRenewalTimer;
          this.start();
        })
    }, 45);
  }

  listenTasksChannel() {
    logger.info('Listening for Business Logic events..');
    
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