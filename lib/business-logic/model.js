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
    return this.handlers.keys().map(id => this.handlers[id]);
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

ServerCodeModel.build = function(files, opts) {
  logger.info('Building Model..');

  let model = new ServerCodeModel(opts.app);

  files.forEach(file => {
    try {
      let loaded = loader.load(file, opts);
      let parsed = parser.parse(loaded, file);

      parsed.handlers && parsed.handlers.forEach(model.addHandler);
      parsed.service && model.addService(parsed.service);
    } catch (e) {
      model.addError(e);
    }
  });

  logger.info(`Model Build completed: ${model.statsString}`);

  return model;
};

module.exports = ServerCodeModel;