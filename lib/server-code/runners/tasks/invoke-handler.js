'use strict';

const domain          = require('domain'),
      path            = require('path'),
      fs              = require('fs'),
      Backendless     = require('backendless'),
      events          = require('../../events'),
      ServerCodeModel = require('../../model'),
      json            = require('../../../util/json'),
      promise         = require('../../../util/promise'),
      logger          = require('../../../util/logger'),
      resultWrapper   = require('./util/result-wrapper');

const TIMED_OUT_ERR = 'Task execution aborted due to timeout';

const defaultClassMappings = {
  [Backendless.User.prototype.___class]: Backendless.User
};

/**
 * @typedef {CodeRunnerTask} InvokeHandlerTask
 * @property {number} eventId
 * @property {string} target
 * @property {boolean} async
 * @property {Array.<number>} arguments
 */

/**
 * @param {InvokeHandlerTask} task
 * @param {Object} runnerOpts
 * @param {ServerCodeModel} model
 * @returns {Promise.<?Array<number>>}
 */
module.exports = function(task, runnerOpts, model) {
  return new Promise((resolve, reject) => {
    task.target = fixTargetJSON(task.target); //TODO: remove me when server is fixed

    const event = events.get(task.eventId);

    if (!event) {
      throw new Error(`Integrity violation. Unknown event id: [${task.eventId}]`);
    }

    model = model || buildModel(task, runnerOpts);

    const classMappings = Object.assign({}, defaultClassMappings, model.classMappings);
    const taskArgs = decodeTaskArguments(task.arguments, classMappings);
    const req = {}, res = {};
    const handlerArgs = [req];

    req.context = taskArgs[0] || {};

    //prepare handler {req}, {res} arguments
    event.args.forEach((name, index) => {
      const arg = taskArgs[index + 1];

      if (name === 'result') {
        res.error = arg && arg.exception;
        res.result = arg && arg.result;

        handlerArgs.push(res);
      } else {
        req[name] = arg;
      }
    });

    function buildResponse(result) {
      if (result !== undefined) {
        req.context.prematureResult = res.result = result;
      }

      event.args.forEach((name, index) => {
        taskArgs[index + 1] = (name === 'result')
          ? event.rawResult ? res.result : resultWrapper.executionResult(res.error, res.result)
          : req[name];
      });

      return encodeTaskArguments(taskArgs);
    }

    function invoke() {
      const handler = model.getHandler(task.eventId, task.target);

      if (!handler) {
        throw new Error(`${event.name}(${task.target}) event handler does not exist`);
      }

      const invocationPromise = Promise.resolve(handler.invoke.apply(null, handlerArgs));
      promise.timeout(task.timeout, invocationPromise, TIMED_OUT_ERR).then(result => {
        resolve(task.async ? undefined : buildResponse(result));
      }, reject);
    }

    const d = domain.create();
    d.on('error', reject);
    d.run(invoke);
  });
};

/**
 * @param {InvokeHandlerTask} task
 * @param {Object} runnerOpts
 * @returns {ServerCodeModel}
 */
function buildModel(task, runnerOpts) {
  const codePath = path.resolve(runnerOpts.backendless.repoPath, task.applicationId.toLowerCase(), task.relativePath);

  logger.debug(`Path to application server code resolved as ${codePath}`);

  const handlerKey = ServerCodeModel.computeHandlerKey(task.eventId, task.target);
  const modelDescriptorPath = `${codePath}/model.json`;

  if (!fs.existsSync(modelDescriptorPath)) {
    throw new Error(`Application Model descriptor not found [${modelDescriptorPath}]`);
  }

  const modelDescriptor = require(modelDescriptorPath);
  const handler = modelDescriptor.handlers[handlerKey];

  if (!handler) {
    throw new Error(`Integrity Error. Handler ${handlerKey} not found`);
  }

  const files = [`${codePath}/${handler.file}`];

  Object.keys(modelDescriptor.types).forEach(type => {
    const file = modelDescriptor.types[type].file;

    files.push(`${codePath}/${file}`);
  });

  return ServerCodeModel.build(codePath, files);
}

/**
 * http://bugs.backendless.com/browse/BKNDLSS-11576
 *
 * @param {string} target
 * @returns {string}
 */
function fixTargetJSON(target) {
  return target && target.replace(/'/g, '"');
}

/**
 * UTF8 Bytes Array -> JSON -> Array of objects classified according to classMappings
 *
 * @param {Array<number>} args
 * @param {Object<String, Function>} classMappings
 * @returns {Array<*>}
 */
function decodeTaskArguments(args, classMappings) {
  return args && args.length && json.parse(new Buffer(args).toString(), classMappings) || [];
}

/**
 * Array of objects -> JSON -> UTF8 Bytes Array
 *
 * @param {*} args
 * @returns {Array<number>}
 */
function encodeTaskArguments(args) {
  return new Buffer(json.stringify(args)).toJSON().data;
}