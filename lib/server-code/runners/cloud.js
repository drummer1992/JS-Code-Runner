"use strict";

const logger          = require('../../util/logger'),
      ServerCodeModel = require('../../server-code/model'),
      DriverService = require('../services/driver'),
      tasksExecutor   = require('./tasks/executor');

//noinspection JSUnusedLocalSymbols,Eslint
function getAppModel(appId, appVersion) {
  const json = require(`../repo/${appId}/model.json`); //TODO: //add some relative path
  return ServerCodeModel.fromJSON(json);
}

class CloudCodeRunner {
  constructor(opts) {
    this.options = opts;

    /** @type DriverService **/
    this.driver = new DriverService(opts.driverUrl, opts.driverRunnerId);
  }

  start() {
    this.driver.getRequest(this.options.driverRequestId)
      .then((req) => this.processRequest(req))
      .catch(err => {
        logger.error(err);
      })
      .then(() => {
        process.exit(0); //TODO: Ideally an event loop must be empty at this point and node.js must exit by itself
      });
  }

  processRequest(req) {
    const appModel = getAppModel(req.applicationId, req.appVersionId);

    return tasksExecutor.execute(req, appModel)
      .then(result => {
        if (result) {
          return this.driver.sendResult(req.id, result);
        }
      })
      .catch(err => {
        logger.error(err.message || err);
      });
  }
}

exports.start = function(opts) {
  logger.info('Starting Cloud Code Runner');

  return new CloudCodeRunner(opts).start();
};