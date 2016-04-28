'use strict';

const fs              = require('fs'),
      path            = require('path'),
      ServerCodeModel = require('./index'),
      logger          = require('../../util/logger'),
      toUnix          = require('../../util/path').toUnix;

const DESCRIPTOR_FILE = 'model.json';

function normalizeDictFilePath(dict) {
  Object.keys(dict).forEach(key => {
    if (dict[key].file) {
      dict[key].file = toUnix(dict[key].file);
    }
  });

  return dict;
}

class ServerCodeModelDescriptor {
  constructor(basePath, opts) {
    this.basePath = basePath;

    this.handlers = normalizeDictFilePath(opts.handlers || {});
    this.types = normalizeDictFilePath(opts.types || {});
    this.services = normalizeDictFilePath(opts.service || {});

    this.definitions = opts.definitions || {};
    this.definitions.files = (this.definitions.files || []).map(toUnix);
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
    logger.debug(`Building model for path: ${this.basePath}`);

    const model = new ServerCodeModel();
    model.definitions.setExplicitly(this.definitions);
    model.loadFiles(this.basePath, this.typesFiles.concat([file]));

    if (model.errors.length) {
      throw new Error(`${model.errors[0].message}. This issue is caused by [${model.errors[0].serverCodeFile}]`);
    }

    return model;
  }

  static load(basePath) {
    const descriptorPath = path.join(basePath, DESCRIPTOR_FILE);

    if (!fs.existsSync(descriptorPath)) {
      throw new Error(`Model Descriptor not found (${descriptorPath})`);
    }

    return new ServerCodeModelDescriptor(basePath, require(descriptorPath));
  }
}

module.exports = ServerCodeModelDescriptor;