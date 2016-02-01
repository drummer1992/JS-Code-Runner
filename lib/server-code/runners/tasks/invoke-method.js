'use strict';

const loadServerCode = require('../../loader').load,
      events         = require('../../events');

function parseTaskContext(task) {
  return JSON.parse(String.fromCharCode.apply(String, task.arguments));
}

function prepareRequest(task) {
  return {
    context: task.arguments[0],
    object : task.arguments[1]
  };
}

function prepareResponse(request, resolve, reject) {
  return {
    success: function(result) {
      //TODO: shouldn't we expect the {request.object} modified instead of taking {response.success} argument ?
      resolve(result);
    },

    error: function(err) {
      reject(err);
    }
  }
}

function getApp(task) {
  return {
    id       : task.applicationId,
    version  : task.appVersionId,
    secretKey: null //TODO: Oops, are we in trouble here ?
  };
}

/**
 * @param {{eventId:number, target:string, async:boolean, arguments:Array}} task
 * @param {ServerCodeModel} model
 * @returns {Promise}
 */
module.exports = function(task, model) {
  return new Promise((resolve, reject) => {
    try {
      task.arguments = parseTaskContext(task); //TODO: what is the necessity of arguments encoding ?

      console.log(task);

      const handler = model.getHandler(task.eventId, task.target);

      if (!handler) {
        return reject(`Integrity violation. ServerCodeModel doesn't contain a handler for ${task.eventId}(${task.target}) event`);
      }

      const request = prepareRequest(task);
      const response = prepareResponse(request, resolve, reject);

      const eventType = events.types.byId[task.eventId];
      const methodName = eventType.name + (task.async ? '' : 'Sync');
      const handlerModule = loadServerCode(handler.provider, getApp(task));

      if (!handlerModule[methodName]) {
        return reject(`Integrity violation. ${handler.provider} doesn't contain (${methodName}) method`);
      }

      handlerModule[methodName](request, response);
    } catch (e) {
      reject(e.message);
    }
  });
};