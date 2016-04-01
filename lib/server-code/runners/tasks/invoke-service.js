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

function transformArguments(args, model, serviceName, methodName) {
  const customTypes = model.definitions.types;
  const serviceDef = customTypes[serviceName];
  const methodDef = serviceDef && serviceDef.methods[methodName];
  const methodParamsDef = methodDef && methodDef.params || [];

  return args.map((arg, i) => {
    const argDef = methodParamsDef && methodParamsDef[i];
    const argType = argDef && model.types[argDef.type.name];

    return argType ? Object.assign(new argType.clazz(), arg) : arg;
  });
}

/**
 * @param {!InvokeServiceTask} task
 * @param {?ServerCodeModel} model
 * @returns {Promise.<*>}
 */
function execute(task, model) {
  return new Promise((resolve, reject) => {
    model = model || buildModel(task);

    const service = model.getService(task.className);

    if (!service) {
      throw new Error(`${task.className} service does not exist`);
    }

    const serviceInst = new service.clazz();

    if (!serviceInst[task.method]) {
      throw new Error(`${task.method} method does not exist`);
    }

    const taskArgs = transformArguments(decodeTaskArguments(task.arguments, {}), model, task.className, task.method);

    /** TODO:
     * -> configuration items
     * -> http headers
     */

    Promise.resolve(serviceInst[task.method].apply(service, taskArgs)).then(resolve, reject);
  });
}

module.exports = execute;