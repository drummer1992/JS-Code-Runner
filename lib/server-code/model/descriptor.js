'use strict';

const fs              = require('fs'),
      ServerCodeModel = require('./index'),
      logger          = require('../../util/logger');

const DESCRIPTOR_FILE = 'model.json';

class ServerCodeModelDescriptor {
  constructor(codePath) {
    this.codePath = codePath;
    this.handlers = {};
    this.types = {};
    this.services = {};
  }

  get typesFiles() {
    return Object.keys(this.types).map(type => this.types[type].file);
  }

  buildModelForHandler(eventId, target) {
    const handlerKey = ServerCodeModel.computeHandlerKey(eventId, target);
    const handler = this.handlers[handlerKey];

    if (!handler) {
      throw new Error(`Integrity Error. Handler ${handlerKey} not found`);
    }

    return this.buildModelForFile(handler.file);
  }

  buildModelForService(serviceName) {
    const service = this.services[serviceName];

    if (!service) {
      throw new Error(`Integrity Error. Service ${serviceName} not found`);
    }

    return this.buildModelForFile(service.file);
  }

  buildModelForFile(file) {
    logger.debug(`Building model for path: ${this.codePath}`);

    const model = new ServerCodeModel();
    model.definitions.setExplicitly(this.definitions);
    model.loadFiles(this.codePath, this.typesFiles.concat([file]));

    if (model.errors.length) {
      throw new Error(`${model.errors[0].message}. This issue is caused by [${model.errors[0].serverCodeFile}]`);
    }
    
    return model;
  }

  static load(path) {
    const descriptorPath = `${path}/${DESCRIPTOR_FILE}`;

    if (!fs.existsSync(descriptorPath)) {
      throw new Error(`Model Descriptor not found (${descriptorPath})`);
    }

    return Object.assign(new ServerCodeModelDescriptor(path), require(descriptorPath));
  }
}

module.exports = ServerCodeModelDescriptor;