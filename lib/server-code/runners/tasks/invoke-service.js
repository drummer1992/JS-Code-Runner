'use strict';

const ServerCodeModelDescriptor = require('../../model/descriptor'),
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
 * @property {InvocationContext} invocationContextDto;
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

function truncateNamespace(className) {
  const tokens = className.split('.');

  return tokens[tokens.length - 1];
}

/**
 * @param {!InvokeServiceTask} task
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
function execute(task, model) {
  return new Promise((resolve, reject) => {
    model = model || buildModel(task);

    const serviceClassName = truncateNamespace(task.className);
    const service = model.getService(serviceClassName);

    if (!service) {
      throw new Error(`${serviceClassName} service does not exist`);
    }

    return service.invokeMethod(task.method, task.invocationContextDto, decodeTaskArguments(task.arguments, {}))
      .then(res => resolve(res || null), reject);
  });
}

module.exports = execute;