'use strict';

const loadServerCode = require('../../loader').load,
      events         = require('../../events'),
      p              = events.providers,
      pipe           = require('../../../util/promise').pipe;

function event(provider, name) {
  return events.types.byProvider[provider.id][name].id;
}

function decodeArguments(task) {
  task.arguments = task.arguments && JSON.parse(String.fromCharCode.apply(String, task.arguments)) || [];
}

function encodeArguments(task) {
  const s = JSON.stringify(task.arguments);
  const args = task.arguments = [];

  for (var i = 0; i < s.length; ++i) {
    args.push(s.charCodeAt(i));
  }
}

function decodeTarget(task) {
  task.target = task.target && task.target.replace(/'/g, '"'); //TODO: http://bugs.backendless.com/browse/BKNDLSS-11576
}

function wrapInvocationResults(task) {
  return {arguments: task.arguments};
}

function wrapInvocationError(err) {
  console.log('Wrapping Invocation Error:' + err);
  console.log(err.stack);

  return {exception: err.message || err};
}

function callHandler(task, model, req, res) {
  return new Promise((resolve, reject) => {
    res.error = reject;
    res.success = function(value) {
      res.result = value || res.result;
      resolve();
    };

    try {
      const handler = model.getHandler(task.eventId, task.target);

      if (!handler) {
        return reject(`Integrity violation. ServerCodeModel doesn't contain a handler for ${task.eventId}(${task.target}) event`);
      }

      const methodName = task.event.name + (task.async ? '' : 'Sync');
      const handlerModule = loadServerCode(handler.provider, model.app);

      if (!handlerModule[methodName]) {
        return reject(`Integrity violation. ${handler.provider} doesn't contain (${methodName}) method`);
      }

      handlerModule[methodName](req, res);
    } catch (e) {
      reject(e);
    }
  });
}

const mappingRules = {
  context: {request: {context: 0}},

  [event(p.DATA, 'beforeCreate')] : {request: {object: 1}},
  [event(p.DATA, 'afterCreate')]  : {request: {object: 1}, response: {result: 2}},
  [event(p.DATA, 'afterFindById')]: {request: {objectId: 1, relations: 2}, response: {result: 3}}
};

function mapTargetToArgs(taskArgs, target, mappings) {
  Object.keys(mappings).forEach(mapping => {
    taskArgs[mappings[mapping]] = target[mapping]
  });
}

function mapArgsToTarget(taskArgs, target, mappings) {
  Object.keys(mappings).forEach(mapping => {
    target[mapping] = taskArgs[mappings[mapping]]
  });
}

function mapArgs(mapping, reverse) {
  const method = reverse ? mapTargetToArgs : mapArgsToTarget;

  return function(task, req, res) {
    if (mapping) {
      mapping.request && method(task.arguments, req, mapping.request);
      mapping.response && method(task.arguments, res, mapping.response);
    }
  };
}

function mapArgsToExchange(task, model, req, res) {
  console.log('mapArgsToExchange:task', task);

  mapArgs(mappingRules.context)(task, req, res);
  mapArgs(mappingRules[task.event.provider.id])(task, req, res);
  mapArgs(mappingRules[task.event.id])(task, req, res);

  console.log('mapArgsToExchange:exchange', req, res);
}

function mapExchangeToArgs(task, model, req, res) {
  console.log('mapExchangeToArgs:exchange', req, res);

  mapArgs(mappingRules.context, true)(task, req, res);
  mapArgs(mappingRules[task.event.provider.id], true)(task, req, res);
  mapArgs(mappingRules[task.event.id], true)(task, req, res);

  console.log('mapExchangeToArgs:task', task);
}

function resolveEvent(task) {
  task.event = events.types.byId[task.eventId];

  if (!task.event) {
    throw new Error(`Integrity violation. Unknown event identifier: ${task.eventId}`);
  }
}

/**
 * @param {{eventId:number, target:string, async:boolean, arguments:Array}} task
 * @param {ServerCodeModel} model
 * @returns {Promise}
 */
module.exports = function(task, model) {
  const req = {}, res = {};

  return pipe([task, model, req, res], [
    resolveEvent,
    decodeArguments,
    decodeTarget,
    mapArgsToExchange,
    callHandler,
    mapExchangeToArgs,
    encodeArguments,
    wrapInvocationResults
  ]).catch(wrapInvocationError);
};