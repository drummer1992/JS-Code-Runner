"use strict";

const logger = require('../util/logger');

exports.handleTasks = function() {
  logger.info('Cloud Runner pretending as if listening to and perform tasks');

  /** TODO:
   * - get request and coderunner IDs from command line arguments
   * - communicate to {CodeRunner Driver} HTTP Server and get the task using requestID (http://{config.driverUrl}/getRequest)
   * - task contains info about application and event
   * - ? download and unpack application business logic files (OR maybe driver already did this for us ?)
   * - read the model from model.json
   * - get the handler, execute it and post the response to http://{config.driverUrl}/sendResult
   */
};