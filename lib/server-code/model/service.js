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
  constructor(clazz, file, definitions) {
    this.clazz = clazz;
    this.file = file;
    this.definitions = definitions;
    this.name = clazz.name;
    this.version = clazz.version || '0.0.0';
    this.description = clazz.description || clazz.name;

    if (!clazz || typeof clazz !== 'function' || !clazz.name) {
      throw new Error('A Service must be a named function-constructor or es6 class');
    }

    this.configItems = (clazz.configItems || []).map(item => new ConfigItem(item));
  }

  xml() {
    return ServiceDescriptor.buildXML([this.name], this.definitions);
  }
}

module.exports = ServiceWrapper;