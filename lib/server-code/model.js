'use strict';

const parser   = require('./parser'),
      loader   = require('./loader'),
      events   = require('./events'),
      fileUtil = require('../util/file'),
      logger   = require('../util/logger');

function handlerKey(eventId, target) {
  const isTimer = events.get(eventId).provider === events.providers.TIMER;

  if (isTimer) {
    target = JSON.parse(target).timername;
  }

  return [eventId, target].join('-');
}

class ServerCodeModel {
  constructor(app, handlers, services, tableItems, errors) {
    this.app = app;

    this.handlers = handlers || {};
    this.services = services || {};
    this.tableItems = tableItems || {};
    this.errors = errors || [];
  }

  addHandler(handler) {
    const key = handlerKey(handler.id, handler.target);

    if (this.handlers[key]) {
      const methodName = events.get(handler.id).name;

      logger.info(`Warning. A duplicated [${methodName}] event handler will be ignored`);
    } else {
      this.handlers[key] = handler;
    }
  }

  getHandler(eventId, target) {
    return this.handlers[handlerKey(eventId, target)];
  }

  addService(service) {
    this.services[service.name] = service;
  }

  addTableItem(tableItem) {
    this.tableItems[tableItem.itemClass.name] = tableItem;
  }

  addError(error) {
    this.errors.push(error);
  }

  get classMappings() {
    const result = {};

    Object.keys(this.tableItems).forEach(key => result[key] = this.tableItems[key].itemClass);

    return result;
  }

  get handlersList() {
    return Object.keys(this.handlers).map(id => this.handlers[id]);
  }

  get timers() {
    return this.handlersList.filter(handler => handler.timer);
  }

  get servicesList() {
    return Object.keys(this.services).map(name => this.services[name]);
  }

  get statsString() {
    const timers     = this.timers.length,
          services   = this.servicesList.length,
          handlers   = this.handlersList.length - timers,
          errors     = this.errors.length,
          tableItems = Object.keys(this.tableItems).length;

    return `event handlers: ${handlers}, timers: ${timers}, table items: ${tableItems}, services: ${services}, errors: ${errors}`;
  }

  serialize() {
    return {
      applicationId: this.app.id,
      appVersionId : this.app.version,
      handlers     : this.handlersList
    };
  }

  invokeEventHandler(eventId, target, args) {
    const handler = this.getHandler(eventId, target);
    const event = events.get(eventId);

    if (!handler) {
      throw new Error(`Event handlers for ${event.name}(${target}) event does not exist`);
    }

    const suffix = ((handler.async && !handler.timer) ? 'Async' : '');
    const methodName = event.name + suffix;
    const handlerModule = loader.load(handler.provider, this.app);

    if (!handlerModule[methodName]) {
      throw new Error(`${handler.provider} doesn't contain '${methodName}' method`);
    }

    return handlerModule[methodName].apply(handlerModule, args);
  }

  toJson() {
    const copy = Object.assign({}, this);
    copy.tableItems = {};

    Object.keys(this.tableItems).forEach(key => copy.tableItems[key] = this.tableItems[key].fileName);

    return JSON.stringify(copy);
  }

  static fromJSON(json) {
    const data = JSON.parse(json);
    const tableItems = {};

    Object.keys(data.tableItems).forEach(key => {
      tableItems[key] = {
        fileName : data.tableItems[key],
        itemClass: require(data.tableItems[key])
      };
    });

    return new ServerCodeModel(data.app, data.handlers, data.services, tableItems, data.errors);
  }
}

/**
 * @param {Object} app Application Options
 * @returns {ServerCodeModel}
 */
ServerCodeModel.build = function(app) {
  logger.info('Building Model..');

  const model = new ServerCodeModel(app);

  const files = fileUtil.expand(app.files, { nodir: true });
  files.forEach(file => {
    logger.debug(`Reading ${file}...`);

    try {
      const loaded = loader.load(file, app);
      const parsed = parser.parse(loaded, file);
      const addHandler = model.addHandler.bind(model);

      parsed.handlers && parsed.handlers.forEach(addHandler);
      parsed.service && model.addService(parsed.service);
      parsed.tableItem && model.addTableItem(parsed.tableItem);
    } catch (e) {
      logger.error(`Error: ${e.message}`);

      model.addError(e.message);
    }
  });

  logger.info(`Model Build completed: ${model.statsString}`);

  return model;
};

module.exports = ServerCodeModel;