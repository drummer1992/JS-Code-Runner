"use strict";

const logger     = require('../../util/logger');

class CloudJobTracker {
  start() {
    logger.info('Starting Cloud Job Tracker');

    /** TODO:
     * - get request and coderunner IDs from command line arguments
     * - communicate to {CodeRunner Driver} HTTP Server and get the task using requestID (http://{config.driverUrl}/getRequest)
     * - task contains info about application and event
     * - read the model from model.json
     * - get the handler, execute it and post the response to http://{config.driverUrl}/sendResult
     */
  }
}

module.exports = CloudJobTracker;