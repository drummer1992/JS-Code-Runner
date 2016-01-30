"use strict";

const logger = require('../../util/logger');

class CloudCodeRunner {
  constructor(opts) {
    this.options = opts;
  }

  start() {
    logger.info('Starting Cloud Code Runner');

    /** TODO:
     * - get request and coderunner IDs from command line arguments
     * - communicate to {CodeRunner Driver} HTTP Server and get the task using requestID (http://{options.driverUrl}/getRequest)
     * - task contains info about application and event
     * - read the model from model.json
     * - get the handler, execute it and post the response to http://{options.driverUrl}/sendResult
     */
  }
}

exports.start = function(opts) {
  return new CloudCodeRunner(opts).start();
};