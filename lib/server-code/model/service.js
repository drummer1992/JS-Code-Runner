'use strict';

const ConfigItems = require('../api').ConfigItems;

const ServiceDescriptor = require('./service-descriptor');

class ConfigItem {
  constructor(opts) {
    if (!opts) {
      throw new Error('Config Item should not be empty');
    }

    Object.assign(this, opts);

    if (!this.name) {
      throw new Error(`config item name is not specified: ${JSON.stringify(opts)}`);
    }

    const withChoices = this.options || !this.options.length;

    this.type = ((withChoices && ConfigItems.TYPES.CHOICE || this.type || ConfigItems.STRING)).toUpperCase();

    if (!ConfigItems.TYPES[this.type]) {
      throw new Error(`Unknown Config Item Type [${this.type}] for ${this.name} config item`);
    }

    if (this.type === ConfigItems.TYPES.CHOICE && !withChoices) {
      throw new Error(`The type of ${this.name} config item is specified as 'choice' but choice options were not specified`);
    }
  }
}

class ServiceWrapper {
  constructor(clazz, file, model) {
    this.clazz = clazz;
    this.file = file;
    this.name = clazz.name;
    this.version = clazz.version || '0.0.0';
    this.description = clazz.description || clazz.name;

    Object.defineProperty(this, 'model', { value: model });

    if (!clazz || typeof clazz !== 'function' || !clazz.name) {
      throw new Error('A Service must be a named function-constructor or es6 class');
    }

    this.configItems = (clazz.configItems || []).map(item => new ConfigItem(item));
  }

  invokeMethod(method, context, args) {
    const instance = new this.clazz();

    if (typeof instance[method] !== 'function') {
      throw new Error(`${method} method does not exist or is not a function`);
    }

    instance.context = context;
    instance.config = {};

    const contextConfig = {};
    context.configurationItems.forEach(item => contextConfig[item.name] = item.value);

    this.configItems.forEach((item) => {
      instance.config[item.name] = contextConfig[item.name] || item.defaultValue;
    });

    return Promise.resolve(instance[method].apply(instance, this.transformArgs(method, args)));
  }

  transformArgs(method, args) {
    const customTypes = this.model.definitions.types;
    const serviceDef = customTypes[this.name];
    const methodDef = serviceDef && serviceDef.methods[method];
    const methodParamsDef = methodDef && methodDef.params || [];

    return args.map((arg, i) => {
      const argDef = methodParamsDef && methodParamsDef[i];
      const argType = argDef && this.model.types[argDef.type.name];

      //TODO: add arrays support and relations instantiation
      return argType ? Object.assign(new argType.clazz(), arg) : arg;
    });
  }

  xml() {
    return ServiceDescriptor.buildXML([this.name], this.model.definitions.types);
  }
}

module.exports = ServiceWrapper;