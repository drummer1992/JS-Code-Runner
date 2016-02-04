'use strict';

const parser = require('./parser'),
      loader = require('./loader'),
      events = require('./events'),
      logger = require('../util/logger');

function handlerKey(eventId, target) {
  const isTimer = events.get(eventId).provider === events.providers.TIMER;

  if (isTimer) {
    target = JSON.parse(target).timername;
  }

  return [eventId, target].join('-');
}

//class EventHandler {
//  constructor(model, opts) {
//    this.id = opts.id;
//    this.async = opts.async;
//    this.timer = opts.timer;
//    this.target = opts.target;
//    this.provider = opts.provider;
//    this.model = model;
//  }
//
//  get event() {
//    return events.get(this.id);
//  }
//
//  invoke(args) {
//    const event = events.get('id');
//    const methodName = event.name + ((this.async && !this.timer) ? 'Async' : '');
//    const handlerModule = loader.load(this.provider, this.model.app);
//
//    if (!handlerModule[methodName]) {
//      throw new Error(`Integrity violation. ${this.provider} doesn't contain (${methodName}) method`);
//    }
//
//    handlerModule[methodName].apply(null, args);
//  }
//}

class ServerCodeModel {
  constructor(app, handlers, services, errors) {
    this.app = app;

    this.handlers = handlers || {};
    this.services = services || {};
    this.errors = errors || [];
  }

  addHandler(handler) {
    const key = handlerKey(handler.id, handler.target);

    if (this.handlers[key]) {
      const methodName = events.get(handler.id).name;

      logger.info(`Warning. A duplicated [${methodName}] event handler will be ignored`);
    } else {
      this.handlers[key] = handler;
    }
  }

  getHandler(eventId, target) {
    return this.handlers[handlerKey(eventId, target)];
  }

  addService(service) {
    this.services[service.name] = service;
  }

  addError(error) {
    this.errors.push(error);
  }

  get handlersList() {
    return Object.keys(this.handlers).map(id => this.handlers[id]);
  }

  get timers() {
    return this.handlersList.filter(handler => handler.timer);
  }

  get statsString() {
    const timers   = this.timers.length,
          handlers = this.handlersList.length - timers,
          errors   = this.errors.length;

    return `event handlers: ${handlers}, timers: ${timers}, errors: ${errors}`;
  }

  serialize() {
    return {
      applicationId: this.app.id,
      appVersionId : this.app.version,
      handlers     : this.handlersList
    };
  }

  toJson() {
    return JSON.stringify(this);
  }

  static fromJSON(json) {
    const data = JSON.parse(json);

    return new ServerCodeModel(data.app, data.handlers, data.services, data.errors);
  }
}

ServerCodeModel.build = function(app) {
  logger.info('Building Model..');

  const model = new ServerCodeModel(app);

  app.files.forEach(file => {
    logger.debug(`Reading ${file}...`);

    try {
      const loaded = loader.load(file, app);
      const parsed = parser.parse(loaded, file);
      const addHandler = model.addHandler.bind(model);

      parsed.handlers && parsed.handlers.forEach(addHandler);
      parsed.service && model.addService(parsed.service);
    } catch (e) {
      logger.error('Error: ' + e.message);

      model.addError(e.message);
    }
  });

  logger.info(`Model Build completed: ${model.statsString}`);

  return model;
};

module.exports = ServerCodeModel;