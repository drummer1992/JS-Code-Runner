'use strict';

const logger          = require('../../util/logger'),
      ServerCodeModel = require('../../server-code/model'),
      DriverService   = require('../services/driver'),
      tasksExecutor   = require('./tasks/executor'),
      Backendless     = require('backendless'),
      path            = require('path');

function getAppModel(repoPath, appId/**, appVersion**/) {
  const modelFile = path.resolve(`${repoPath}}/${appId}/model.json`);

  logger.debug(`Path to application model file resolved as ${modelFile}`);

  return ServerCodeModel.fromJSON(require(modelFile));
}

class CloudCodeRunner {
  constructor(opts) {
    this.options = opts;

    /** @type DriverService **/
    this.driver = new DriverService(opts.driverHost, opts.driverPort, opts.driverRunnerId);

    Backendless.serverUrl = opts.backendless.apiServer || Backendless.serverUrl;
  }

  start() {
    return this.driver.getRequest(this.options.driverRequestId)
      .then((req) => this.processRequest(req));
  }

  processRequest(req) {
    const appModel = getAppModel(this.options.backendless.repoPath, req.applicationId, req.appVersionId);

    this.initClientSDK(appModel);

    return tasksExecutor.execute(req, appModel, this.options)
      .then(result => {
        return result && this.driver.sendResult(req.id, result);
      });
  }

  initClientSDK(model) {
    Backendless.initApp(model.app.id, model.app.secretKey, model.app.version);
  }
}

exports.start = function(opts) {
  logger.info('Starting Cloud Code Runner');

  return new CloudCodeRunner(opts).start();
};