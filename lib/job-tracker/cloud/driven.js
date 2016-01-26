"use strict";

const JobTracker = require('../tracker'),
      logger     = require('../../util/logger');

class DrivenJobTracker extends JobTracker {
  start() {
    logger.info('Starting Driver Driven Job Tracker');

    /** TODO:
     * - get request and coderunner IDs from command line arguments
     * - communicate to {CodeRunner Driver} HTTP Server and get the task using requestID (http://{config.driverUrl}/getRequest)
     * - task contains info about application and event
     * - ? download and unpack application business logic files (OR maybe driver already did this for us ?)
     * - read the model from model.json
     * - get the handler, execute it and post the response to http://{config.driverUrl}/sendResult
     */
  }
}

module.exports = DrivenJobTracker;
