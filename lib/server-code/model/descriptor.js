'use strict';

const fs = require('fs');
const DESCRIPTOR_FILE = 'model.json';
const ServerCodeModel = require('./index');

class ServerCodeModelDescriptor {

  constructor(codePath) {
    this.codePath = codePath;
    this.handlers = {};
    this.types = {};
    this.services = {};
  }

  get typesFiles() {
    return Object.keys(this.types).map(type => {
      return `${this.codePath}/${this.types[type].file}`;
    });
  }
  
  buildModelForHandler(eventId, target) {
    const handlerKey = ServerCodeModel.computeHandlerKey(eventId, target);
    const handler = this.handlers[handlerKey];

    if (!handler) {
      throw new Error(`Integrity Error. Handler ${handlerKey} not found`);
    }

    const model = new ServerCodeModel();
    model.loadFiles(this.codePath, this.typesFiles.concat([handler.file]));
    
    return model;
  }

  buildModelForService(serviceName) {
    const service = this.services[serviceName];

    if (!service) {
      throw new Error(`Integrity Error. Service ${serviceName} not found`);
    }

    const model = new ServerCodeModel();
    model.setDefinitions(this.definitions);
    model.loadFiles(this.typesFiles.concat([service.file]));
    
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