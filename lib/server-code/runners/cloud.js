"use strict";

const logger          = require('../../util/logger'),
      ServerCodeModel = require('../../server-code/model'),
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
    this.driver = require('../services/driver')(opts.driverUrl, opts.driverRunnerId);
  }

  start() {
    this.driver.getRequest(this.options.driverRequestId)
      .then(this.processRequest.bind(this));
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
        //TODO: I suppose we should send the error to the driver
      });
  }
}

exports.start = function(opts) {
  logger.info('Starting Cloud Code Runner');

  return new CloudCodeRunner(opts).start();
};