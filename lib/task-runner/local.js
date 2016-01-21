"use strict";

const logger = require('../util/logger');

exports.handleTasks = function() {
  logger.info('Local Runner pretending as if listening to and perform tasks');

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
};