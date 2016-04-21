'use strict';

const ServerCode     = require('../api'),
      events         = require('../events'),
      ServiceWrapper = require('./service'),
      jsdoc          = require('../../util/jsdoc'),
      logger         = require('../../util/logger');

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
    const key = ServerCodeModel.computeHandlerKey(handler.eventId, handler.target);

    if (this.handlers[key]) {
      const methodName = events.get(handler.eventId).name;

      throw new Error(`{${methodName}(${handler.target}) event handler already exists`);
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

    const serviceWrapper = new ServiceWrapper(service, file.relativePath, this);

    if (this.services[serviceWrapper.name]) {
      throw new Error(`"["${serviceWrapper.name}" service already exists`);
    }

    this.services[serviceWrapper.name] = serviceWrapper;
  }

  addType(type, file) {
    this.definitions.addFile(file);

    if (this.types[type.name]) {
      throw new Error(`"["${type.name}" custom type already exists`);
    }

    this.types[type.name] = { name: type.name, clazz: type, file: file.relativePath };
  }

  addError(error, serverCodeFile, erredFile) {
    this.errors.push({ message: error.message || error, serverCodeFile, erredFile: erredFile.relativePath });
  }

  get classMappings() {
    const result = {};

    Object.keys(this.types).forEach(name => {
      result[name] = this.types[name].clazz;
    });

    return result;
  }

  get summary() {
    const handlers = this.handlers.values(),
          timers   = handlers.filter(h => h.timer);

    /*eslint prefer-template: 0*/
    return 'event handlers: ' + (handlers.length - timers.length) +
      ', timers: ' + timers.length +
      ', custom types: ' + this.types.values().length +
      ', services: ' + this.services.values().length +
      ', errors: ' + this.errors.length;
  }

  loadFiles(basePath, files) {
    ServerCode.load(basePath, files, this);
  }

  isEmpty() {
    return this.handlers.values().length === 0 && this.services.values().length === 0;
  }

  static computeHandlerKey(eventId, target) {
    const isTimer = events.get(eventId).provider === events.providers.TIMER;

    if (isTimer) {
      target = JSON.parse(target).timername;
    }

    return [eventId, target].join('-');
  }

  /**
   * @param {String} basePath
   * @param {Array.<String>} files
   * @returns {ServerCodeModel}
   */
  static build(basePath, files) {
    logger.info('Building Model..');

    const model = new ServerCodeModel();
    model.loadFiles(basePath, files);

    logger.info(`Model Build completed: ${model.summary}`);

    return model;
  }
}

module.exports = ServerCodeModel;