'use strict';

const domain          = require('domain'),
      path            = require('path'),
      Backendless     = require('backendless'),
      events          = require('../../events'),
      ServerCodeModel = require('../../model'),
      json            = require('../../../util/json'),
      promise         = require('../../../util/promise'),
      logger          = require('../../../util/logger'),
      resultWrapper   = require('./util/result-wrapper');

const TIMED_OUT_ERR = 'Task execution aborted due to timeout';
const defaultClassMappings = { [Backendless.User.prototype.___class]: Backendless.User };

/**
 * @typedef {Object} RequestMethodInvocation
 * @property {number} eventId
 * @property {string} target
 * @property {boolean} async
 * @property {Array.<number>} arguments
 * @property {number} timeout
 * @property {string} lang;
 * @property {string} applicationId
 * @property {string} appVersionId
 * @property {string} relativePath
 */

/**
 * @param {RequestMethodInvocation} task
 * @param {Object} runnerOpts
 * @param {ServerCodeModel} model
 * @returns {Promise.<?Array<number>>}
 */
module.exports = function(task, runnerOpts, model) {
  return new Promise((resolve, reject) => {
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

    function sendResult(result) {
      if (result !== undefined) {
        req.context.prematureResult = res.result = result;
      }

      event.args.forEach((name, index) => {
        taskArgs[index + 1] = (name === 'result')
          ? resultWrapper.executionResult(res.error, res.result)
          : req[name];
      });

      resolve(encodeTaskArguments(taskArgs));
    }

    function invoke() {
      const result = model.invokeEventHandler(task.eventId, fixTargetJSON(task.target), handlerArgs);

      if (task.async) {
        resolve(); //empty invocation result for async events
      } else {
        promise.timeout(task.timeout, Promise.resolve(result), TIMED_OUT_ERR)
          .then(sendResult, reject);
      }
    }

    const d = domain.create();
    d.on('error', reject);
    d.run(invoke);
  });
};

/**
 * @param {RequestMethodInvocation} task
 * @param {Object} runnerOpts
 * @returns {ServerCodeModel}
 */
function buildModel(task, runnerOpts) {
  const modelFile = path.resolve(`${runnerOpts.repoPath}}/${task.relativePath}/model.json`);

  logger.debug(`Path to application model file resolved as ${modelFile}`);

  const model = ServerCodeModel.fromJSON(require(modelFile));

  initClientSdk(model, runnerOpts);

  return model;
}

/**
 * @param {ServerCodeModel} model
 * @param {Object} runnerOpts
 */
function initClientSdk(model, runnerOpts) {
  Backendless.serverUrl = runnerOpts.backendless.apiServer || Backendless.serverUrl;
  Backendless.initApp(model.app.id, model.app.secretKey, model.app.version);
}

/**
 * http://bugs.backendless.com/browse/BKNDLSS-11576
 * TODO: remove me when server is fixed
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
 * @param {Object} classMappings
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