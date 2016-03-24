'use strict';

const ServerCodeModelDescriptor = require('../../model/descriptor'),
      logger                    = require('../../../util/logger'),
      json                      = require('../../../util/json');

/**
 * @typedef {Object} BlConfigurationItem
 * @property {String} name;
 * @property {String} value;
 * @property {String} productId;
 */

/**
 * @typedef {Object} InvocationContext
 *
 * @property {String} userId;
 * @property {String} userToken;
 * @property {Array.<String>} userRoles;
 * @property {String} deviceType;
 * @property {Object.<String, String>} httpHeaders;
 * @property {Array.<BlConfigurationItem>} configurationItems
 */

/**
 * @typedef {CodeRunnerTask} InvokeServiceTask
 * @property {String} serviceId;
 * @property {String} serviceVersionId;
 * @property {String} fileType;
 * @property {String} className;
 * @property {String} method;
 * @property {Array<number>} arguments;
 * @property {InvocationContext} invocationContext;
 * @property {Object.<string, Object>} properties;
 */

/**
 * @param {InvokeServiceTask} task
 * @returns {ServerCodeModel}
 */
function buildModel(task) {
  return ServerCodeModelDescriptor.load(task.codePath).buildModelForService(task.serviceId);
}

function decodeTaskArguments(args, classMappings) {
  return args && args.length && json.parse(new Buffer(args).toString(), classMappings) || [];
}

/**
 * @param {!InvokeServiceTask} task
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
function execute(task, model) {
  const taskArgs = decodeTaskArguments(task.arguments, {});

  logger.debug(`Invoking service task:
      task : ${JSON.stringify(task, null, 2)}
      task args: ${JSON.stringify(taskArgs)}
      model: ${JSON.stringify(model, null, 2)}`);

  model = model || buildModel(task);

  /** TODO:
   * -> return model.invokeServiceMethod(task.className, task.method, taskArgs, task.invocationContext.configurationItems);
   * -> should we collect configuration items back after service method invocation ?
   * -> do we need result transformation ?
   */

  return Promise.reject('Not implemented yet');
}

module.exports = execute;