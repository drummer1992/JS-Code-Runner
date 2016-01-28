'use strict';

const serverCodeApi = require('./api'),
      logger        = require('../util/logger'),
      clientApi     = require('backendlessjs');

/**
 * @param {*} module
 * @param {{backendless:Object, app: Object}} opts
 */
function unwrapServerCodeModule(module, opts) {
  let serverCodeWrapper = module instanceof Function
    && module.length === 1
    && module.toString().includes('.serverCode');

  if (serverCodeWrapper) {
    clientApi.serverUrl = opts.backendless.apiServer;
    clientApi.initApp(opts.app.id, opts.app.secretKey, opts.app.version);

    let context = {serverCode: serverCodeApi, api: clientApi};

    return module(context);
  }
}

exports.load = function(path, opts) {
  let serverCode;

  try {
    logger.debug(`Reading ${path}...`);
    let module = require(path);

    logger.debug(`Analyzing ${path}...`);
    serverCode = unwrapServerCodeModule(module, opts);
  } catch (e) {
    throw new Error(`Unable to load ${path}. Error: ${e.message}`);
  }

  if (serverCode instanceof serverCodeApi.ServerCode) {
    return serverCode;
  }

  throw new Error('Not a Server Code file');
};