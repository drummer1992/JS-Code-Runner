'use strict';

const ServerCode            = require('../api'),
      events                = require('../events'),
      ServiceWrapper        = require('./service'),
      jsdoc                 = require('../../util/jsdoc'),
      logger                = require('../../util/logger'),
      serverCodeFilesInPath = require('../../util/file').serverCodeFilesInPath,
      printer               = require('./printer');

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
    this.services = new Dictionary();
    this.definitions = new Definitions();
    this.errors = [];
  }

  addHandler(handler) {
    const isTimer = events.get(handler.eventId).provider === events.providers.TIMER;
    const target = isTimer ? JSON.parse(handler.target).timername : handler.target;
    const key = ServerCodeModel.computeHandlerKey(handler.eventId, target);

    if (this.handlers[key]) {
      const methodName = events.get(handler.eventId).name;

      throw new Error(`[${methodName}(${handler.target})] event handler already exists`);
    }

    this.handlers[key] = handler;
  }

  getHandler(eventId, target) {
    return this.handlers[ServerCodeModel.computeHandlerKey(eventId, target)];
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
      message  : error.message,
      position : error.position,
      serverCodeFile,
      erredFile: erredFile && erredFile.relativePath
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

  loadFiles(basePath, exclude) {
    ServerCode.load(basePath, exclude, this);
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