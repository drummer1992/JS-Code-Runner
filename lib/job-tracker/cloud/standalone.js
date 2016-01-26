"use strict";

const JobTracker = require('../tracker'),
      logger     = require('../../util/logger');

class StandaloneJobTracker extends JobTracker {
  start() {
    logger.info('Starting Standalone Cloud Job Tracker');

    /** TODO:
     * - registerCodeRunner in Backendless (is this needed for running in cloud ?)
     *   - HTTP POST {config.backendless.url(https://api.backendless.com)}/servercode/registerRunner:
     *   - store the debugId from response
     *   - keep {debugId} redis key alive
     *
     * - registerCodeRunner in Redis (why?)
     *   - redis.connect(config.host,config.port).set("instance_of_coderunner_{UUID}", "REGISTERED");
     *   - keep it alive in redis
     *
     * - listen 'MAIN_EVENTS_CHANNEL' events channel in Redis
     *   - when task arrives
     *      - download app files and unpack it under {config.repo} folder
     *      - parse app model
     *      - execute handler/timer/service
     *        - execution must be performed in a separated process under a specific, limited and on demand created user
     *      - put the response back to Redis (what key ?)
     */
  }
}

module.exports = StandaloneJobTracker;
