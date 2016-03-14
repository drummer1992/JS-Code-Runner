'use strict';

const path            = require('path'),
      Module          = require('module'),
      Backendless     = require('backendless'),
      logger          = require('../../util/logger'),
      events          = require('../events'),
      PersistenceItem = require('./persistence-item'),
      providers       = events.providers,
      TIMER           = providers.TIMER,
      CUSTOM          = providers.CUSTOM,
      nodeRequire     = Module.prototype.require;

let contextModel;

const contexts = [];

function contextFile() {
  return contexts[contexts.length - 1];
}

function contextGuarded(apiMethod) {
  return function() {
    const file = contextFile();

    if (file && contextModel) {
      return apiMethod.apply(ServerCode, arguments);
    } else {
      logger.error('ServerCode registration is allowed only synchronously during module load phase');
    }
  };
}

function addHandler(eventId, target, async, invoke, timer) {
  contextModel.addHandler({ eventId, target, async, invoke, timer: !!timer, file: contextFile() });
}

const ServerCode = {};

ServerCode.PersistenceItem = PersistenceItem;

/**
 * @param {Function} type
 * @returns {Function} Passed type
 */
ServerCode.addType = contextGuarded(function(type) {
  if (!type || typeof type != 'function' || !type.name) {
    throw new Error('A type must be a named function-constructor or es6 class');
  }

  contextModel.addType(type, contextFile());

  return type;
});

/**
 * @typedef {String|Number|Date} DateTime
 */

/**
 * @typedef {Object} Timer
 * @param {String} timer.name
 * @param {?DateTime} timer.startDate
 * @param {Object} timer.frequency
 * @param {?DateTime} timer.expire
 */

/**
 * @name Backendless.ServerCode.addTimer
 *
 * @param {Timer} timer
 */
ServerCode.addTimer = contextGuarded(function(timer) {
  const event = TIMER.events['execute'];
  const handler = timer[event.name];

  const fileName = contextFile();

  const timername = timer.name || timer.timername || path.basename(fileName, '.js');
  const frequency = timer.frequency || {};
  const schedule = frequency.schedule;
  let startDate = timer.startDate;
  let expire = timer.expire;

  if (!handler) {
    throw new Error(`${timername} timer must contain [${event.name}}] method`);
  }

  const now = new Date().getTime();
  const singleTick = schedule === 'once';

  if (startDate) {
    startDate = new Date(startDate).getTime();

    if (startDate < now && singleTick) {
      throw new Error(`${timername} timer is scheduled to run only once its [startDate] is in the past`);
    }
  } else if (singleTick) {
    throw new Error(`${timername} timer is scheduled to run only once but its [startDate] is not specified`);
  } else {
    startDate = now;
  }

  if (expire) {
    expire = new Date(expire).getTime();

    if (expire < now) {
      throw new Error(`${timername} timer already expired`);
    }
  }

  const target = JSON.stringify({ timername, startDate, expire, frequency });

  addHandler(event.id, target, true, handler, true);
});

/**
 * @param {String} eventName
 * @param {Function} handler
 * @param {Boolean} async
 */
ServerCode.customEvent = contextGuarded((eventName, handler, async) => {
  addHandler(CUSTOM.events[0].id, eventName, async, handler);
});

/**
 * @param {Function} service
 * @returns {Function} Passed service
 */
ServerCode.addService = contextGuarded((service) => {
  if (!service || typeof service !== 'function' || !service.name) {
    throw new Error('A Service must be a named function-constructor or es6 class');
  }

  contextModel.addService(service, contextFile());

  return service;
});

Object.keys(events.providers).forEach(providerName => {
  const provider = events.providers[providerName];

  if (provider !== CUSTOM && provider !== TIMER) {
    ServerCode[providerName.toLowerCase()] = {};

    Object.keys(provider.events).forEach(eventName => {
      const event = provider.events[eventName];

      ServerCode[providerName.toLowerCase()][eventName] = function() {
        const targeted = typeof arguments[0] !== 'function';

        const target = targeted ? arguments[0] : '*';
        const handler = arguments[targeted ? 1 : 0];
        const async = !!arguments[targeted ? 2 : 1];

        addHandler(event.id, target, async, handler);
      };
    });
  }
});

ServerCode.load = function(basePath, files, model) {
  contextModel = model;

  files.forEach(file => {
    const filePath = path.resolve(file);

    logger.debug(`Reading ${file}...`);

    Module.prototype.require = contextifyRequire(basePath);

    try {
      require(filePath);
    } catch (e) {
      logger.error(`Error: ${e.message}`);
      logger.debug(e.stack);

      contextModel.addError(e, file, contextFile());
    }

    Module.prototype.require = nodeRequire;
  });

  contextModel = null;
};

function contextifyRequire(basePath) {
  return function(modulePath) {
    if (modulePath === 'backendless') {
      return Backendless;
    }

    let context = Module._resolveFilename(modulePath, this);

    if (context.startsWith(basePath)) {
      context = context.substring(basePath.length + 1);
    }

    contexts.push(context);

    const result = nodeRequire.call(this, modulePath);

    contexts.pop();

    return result;
  };
}

module.exports = ServerCode;