'use strict';

const ServerCode     = require('../api'),
      events         = require('../events'),
      ServiceWrapper = require('./service'),
      jsdoc          = require('../../util/jsdoc'),
      logger         = require('../../util/logger'),
      printer        = require('./printer');

class Dictionary {
  keys() {
    return Object.keys(this);
  }

  values() {
    return this.keys().map(key => this[key]);
  }
}

class Definitions {
  constructor() {
    this.files = [];
    this.types = {};
  }

  setExplicitly(definitions) {
    this.explicit = true;

    this.files = definitions && definitions.files || [];
    this.types = definitions && definitions.types || [];
  }

  addFile(file) {
    if (!this.explicit && this.files.indexOf(file.relativePath) === -1) {
      this.files.push(file.relativePath);

      const foundClasses = jsdoc.describeClasses(file.absolutePath);
      foundClasses.forEach(classDef => this.types[classDef.name] = classDef);
    }
  }
}

class ServerCodeModel {
  constructor() {
    this.types = new Dictionary();
    this.handlers = new Dictionary();
    this.timers = new Dictionary();
    this.services = new Dictionary();
    this.definitions = new Definitions();
    this.errors = [];
  }

  addHandler(handler) {
    const key = ServerCodeModel.computeHandlerKey(handler.eventId, handler.target);

    if (this.handlers[key]) {
      const methodName = events.get(handler.eventId).name;

      throw new Error(`[${methodName}(${handler.target})] event handler already exists`);
    }

    this.handlers[key] = handler;
  }

  addTimer(timer) {
    if (this.timers[timer.name]) {
      throw new Error(`[${timer.name}] timer already exists`);
    }

    this.timers[timer.name] = timer;
  }

  getHandler(eventId, target) {
    const isTimer = events.get(eventId).provider === events.providers.TIMER;

    return isTimer
      ? this.timers[target]
      : this.handlers[ServerCodeModel.computeHandlerKey(eventId, target)];
  }

  getService(serviceName) {
    return this.services[serviceName];
  }

  addService(service, file) {
    this.definitions.addFile(file);

    if (!service.description) {
      const serviceDef = this.definitions.types[service.name];

      if (serviceDef) {
        service.description = serviceDef.description;
      }
    }

    const serviceWrapper = new ServiceWrapper(service, file.relativePath, this);

    if (this.services[serviceWrapper.name]) {
      throw new Error(`[${serviceWrapper.name}] service already exists`);
    }

    this.services[serviceWrapper.name] = serviceWrapper;
  }

  addType(type, file) {
    this.definitions.addFile(file);

    if (this.types[type.name]) {
      throw new Error(`[${type.name}] custom type already exists`);
    }

    this.types[type.name] = { name: type.name, clazz: type, file: file.relativePath };
  }

  addError(error, serverCodeFile, erredFile) {
    this.errors.push({
      message : error.message,
      position: error.position,
      serverCodeFile,
      erredFile
    });
  }

  get classMappings() {
    const result = {};

    Object.keys(this.types).forEach(name => {
      result[name] = this.types[name].clazz;
    });

    return result;
  }

  print() {
    printer.print(this);
  }

  toServerModel() {
    const toServerService = service => ({
      name       : service.name,
      version    : service.version,
      description: service.description,
      xml        : service.xml(),
      config     : service.configItems
    });

    return {
      ___jsonclass: 'com.backendless.coderunner.commons.model.BLModel',
      handlers: this.handlers.values(),
      timers  : this.timers.values(),
      services: this.services.values().map(toServerService)
    };
  }

  loadFiles(basePath, exclude, files) {
    ServerCode.load(basePath, exclude, this, files);
  }

  isEmpty() {
    return this.handlers.values().length === 0 && this.services.values().length === 0;
  }

  static computeHandlerKey(eventId, target) {
    return [eventId, target].join('-');
  }

  /**
   * @param {String} basePath
   * @param {Array.<String>} [exclude]
   * @returns {ServerCodeModel}
   */
  static build(basePath, exclude) {
    logger.info('Building Model..');

    const model = new ServerCodeModel();
    model.loadFiles(basePath, exclude);

    logger.info('Model Build completed');

    model.print();

    return model;
  }
}

module.exports = ServerCodeModel;