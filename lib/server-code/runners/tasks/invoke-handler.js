'use strict';

const domain                    = require('domain'),
      events                    = require('../../events'),
      ServerCodeModelDescriptor = require('../../model/descriptor'),
      argsUtil                  = require('./util/args'),
      resultWrapper             = require('./util/result-wrapper');

/**
 * @typedef {CodeRunnerTask} InvokeHandlerTask
 * @property {number} eventId
 * @property {string} target
 * @property {boolean} async
 * @property {Array.<number>} arguments
 */

/**
 * @param {InvokeHandlerTask} task
 * @param {ServerCodeModel} model
 * @returns {Promise.<?Array<number>>}
 */
function execute(task, model) {
  return new Promise((resolve, reject) => {
    task.target = fixTargetJSON(task.target); //TODO: remove me when server is fixed

    const event = events.get(task.eventId);

    if (!event) {
      throw new Error(`Integrity violation. Unknown event id: [${task.eventId}]`);
    }

    model = model || buildModel(task);

    const taskArgs = argsUtil.decode(task.arguments, model.classMappings);
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

      const wrap = event.resultWrapper || resultWrapper.executionResult;

      event.args.forEach((name, index) => {
        taskArgs[index + 1] = (name === 'result')
          ? wrap(res.error, res.result)
          : req[name];
      });

      return taskArgs;
    }

    const d = domain.create();
    d.on('error', reject);
    d.run(() => {
      const handler = model.getHandler(task.eventId, task.target);

      if (!handler) {
        throw new Error(`${event.name}(${task.target}) event handler does not exist`);
      }

      Promise.resolve(handler.invoke.apply(null, handlerArgs)).then(result => {
        resolve(task.async ? undefined : buildResponse(result));
      }, reject);
    });
  });
}

/**
 * @param {InvokeHandlerTask} task
 * @returns {ServerCodeModel}
 */
function buildModel(task) {
  return ServerCodeModelDescriptor.load(task.codePath).buildModelForHandler(task.eventId, task.target);
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

module.exports = execute;