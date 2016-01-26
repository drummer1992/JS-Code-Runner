"use strict";

const JobTracker = require('../tracker'),
      logger     = require('../../util/logger');

class LocalJobTracker extends JobTracker {
  constructor(model) {
    this.model = model;

    super();
  }

  start() {
    logger.info('Starting Local JobTracker...');

    this.register()
      .then(this.registerInRedis);

    /** TODO:
     * - registerCodeRunner in Backendless
     *   - HTTP POST {config.backendless.url(https://api.backendless.com)}/servercode/registerRunner:
     *   - store the debugId from response
     *   - keep {debugId} redis key alive
     *
     * - registerCodeRunner in Redis (why?)
     *   - redis.connect(config.host,config.port).set("instance_of_coderunner_{UUID}", "REGISTERED");
     *   - keep it alive in redis
     *
     * - registerModel in Backendless
     *
     * - listen {applicationId} events channel in Redis
     *   - when task arrives
     *     - get the handler, execute it and put the response to Redis
     */
  }
}

module.exports = LocalJobTracker;