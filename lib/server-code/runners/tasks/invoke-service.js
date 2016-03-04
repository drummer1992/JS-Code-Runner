'use strict';

const path            = require('path'),
      Backendless     = require('backendless'),
      ServerCodeModel = require('../../model'),
      logger          = require('../../../util/logger'),
      json            = require('../../../util/json');

/**
 * @typedef {Object} BlConfigurationItem
 * @property {String} name;
 * @property {String} value;
 * @property {String} productId;
 */

/**
 * @typedef {Object} InvocationContext
 * @property {Array.<BlConfigurationItem>} configurationItems
 */

/**
 * @typedef {Object} InitAppData
 * @property {string} secretKey
 * @property {string} url
 * @property {string} appVersionName
 */

/**
 * @typedef {Object} RequestServiceInvocation
 * @property {String} applicationId;
 * @property {String} appVersionId;
 * @property {String} serviceId;
 * @property {String} serviceVersionId;
 * @property {String} fileType;
 * @property {String} className;
 * @property {String} method;
 * @property {Array<number>} arguments;
 * @property {InitAppData} initAppData;
 * @property {InvocationContext} invocationContext;
 * @property {Object.<string, Object>} properties;
 * @property {String} relativePath;
 */

/**
 * @param {!RequestServiceInvocation} task
 * @param {Object} runnerOpts
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
module.exports = function(task, runnerOpts, model) {

  const taskArgs = decodeTaskArguments(task.arguments, {});

  logger.debug(`Invoking service task:
      task : ${JSON.stringify(task, null, 2)}
      task args: ${JSON.stringify(taskArgs)}
      model: ${JSON.stringify(model, null, 2)}`);

  model = model || buildModel(task, runnerOpts);

  /** TODO:
   * -> return model.invokeServiceMethod(task.className, task.method, taskArgs, task.invocationContext.configurationItems);
   * -> should we collect configuration items back after service method invocation ?
   * -> do we need result transformation ?
   */

  return Promise.reject('Not implemented yet');
};

/**
 * @param {RequestServiceInvocation} task
 * @param {Object} runnerOpts
 * @returns {ServerCodeModel}
 */
function buildModel(task, runnerOpts) {
  initClientSdk(task);

  const serviceXml = path.resolve(`${runnerOpts.repoPath}}/${task.relativePath}/${task.serviceId}.xml`);

  logger.debug('Path to service xml file resolved as ' + serviceXml);

  /** TODO:
   * -> return ServerCodeModel.fromXml(require(serviceXml));
   */

  return new ServerCodeModel();
}

/**
 * @param {RequestServiceInvocation} task
 */
function initClientSdk(task) {
  Backendless.serverUrl = task.initAppData.url;
  Backendless.initApp(task.applicationId, task.initAppData.secretKey, task.initAppData.appVersionName);
}

function decodeTaskArguments(args, classMappings) {
  return args && args.length && json.parse(new Buffer(args).toString(), classMappings) || [];
}
