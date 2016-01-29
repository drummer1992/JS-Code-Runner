'use strict';

const parser = require('./parser'),
      loader = require('./loader'),
      logger = require('../util/logger');

class ServerCodeModel {
  constructor(app) {
    this.app = app;

    this.handlers = {};
    this.services = {};
    this.errors = [];
  }

  addHandler(handler) {
    this.handlers[handler.id] = handler;
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
    return this.handlersList.filter(handler => handler.isTimer);
  }

  get statsString() {
    let timers   = this.timers.length,
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
}

ServerCodeModel.build = function(app) {
  logger.info('Building Model..');

  let model = new ServerCodeModel(app);

  app.files.forEach(file => {
    logger.debug(`Reading ${file}...`);

    try {
      let loaded = loader.load(file, app);
      let parsed = parser.parse(loaded, file);

      parsed.handlers && parsed.handlers.forEach(handler => model.addHandler(handler));
      parsed.service && model.addService(parsed.service);
    } catch (e) {
      logger.error('Error: ' + e.message);

      model.addError(e);
    }
  });

  logger.info(`Model Build completed: ${model.statsString}`);

  return model;
};

module.exports = ServerCodeModel;