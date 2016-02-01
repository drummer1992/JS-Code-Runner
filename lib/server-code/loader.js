'use strict';

const serverCodeApi = require('./api'),
      path          = require('path'),
      logger        = require('../util/logger'),
      clientApi     = require('backendlessjs');

/**
 * @param {*} module
 * @param {Object} app
 * @param {string} apiServer
 */
function unwrapServerCodeModule(module, app, apiServer) {
  let serverCodeWrapper = module instanceof Function
    && module.length === 1
    && module.toString().includes('.serverCode');

  if (serverCodeWrapper) {
    clientApi.serverUrl = apiServer || clientApi.serverUrl;
    clientApi.initApp(app.id, app.secretKey, app.version);

    let context = {serverCode: serverCodeApi, api: clientApi};

    return module(context);
  }
}

exports.load = function(file, app, apiServer) {
  const resolved = path.resolve(file);

  logger.debug(`[${file}] resolved to [${resolved}]`);

  const module = require(resolved);
  const serverCode = unwrapServerCodeModule(module, app, apiServer);

  if (serverCode instanceof serverCodeApi.ServerCode) {
    return serverCode;
  }

  throw new Error('Not a Server Code file');
};