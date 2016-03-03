'use strict';

const ServerCode = require('./api'),
      path       = require('path'),
      logger     = require('../util/logger'),
      clientApi  = require('backendless');

/**
 * @param {*} module
 * @param {Object} app
 * @param {string} apiServer
 *
 * @returns {*}
 */
function unwrapServerCodeModule(module, app, apiServer) {
  let serverCodeWrapper = module instanceof Function
    && module.length === 1
    && module.toString().includes('.ServerCode');

  if (serverCodeWrapper) {
    clientApi.serverUrl = apiServer || clientApi.serverUrl;
    clientApi.initApp(app.id, app.secretKey, app.version);

    let context = {ServerCode: ServerCode, api: clientApi};

    return module(context);
  }
}

exports.load = function(file, app, apiServer) {
  const resolved = path.resolve(file);

  logger.debug(`[${file}] resolved to [${resolved}]`);

  const module = require(resolved);
  const serverCode = unwrapServerCodeModule(module, app, apiServer);

  if ((serverCode && serverCode.prototype || serverCode) instanceof ServerCode) {
    return serverCode;
  }

  throw new Error('Not a Server Code file');
};