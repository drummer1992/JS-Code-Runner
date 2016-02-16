"use strict";

const providers = require('./events').providers;
const Backendless = require('backendless');

class ServerCode {
}

class Service extends ServerCode {
}

//noinspection Eslint
Service.create = function(name, mappings) {

};

class PersistenceItem extends ServerCode {
  constructor() {
    super();

    /**
     Whether this component is visible or not

     @name PersistenceItem#ownerId
     @type Boolean
     */
    this.ownerId = undefined;

    /**
     Item identifier

     @name PersistenceItem#objectId
     @type String
     */
    this.objectId = undefined;

    /**
     When this item was created

     @name PersistenceItem#created
     @type Number
     */
    this.created = undefined;

    /**
     When this item was updated

     @name PersistenceItem#updated
     @type Number
     */
    this.updated = undefined;
  }

  save() {
    return this.dataStore.save(this);
  }

  remove() {
    return this.dataStore.remove(this);
  }

  get className() {
    return this.__proto__.constructor.name;
  }

  static get className() {
    return this.prototype.constructor.name;
  }

  static get dataStore() {
    return Backendless.Data.of(this.className());
  }

  get dataStore() {
    return Backendless.Data.of(this.className());
  }

  static findFirst() {
    return this.dataStore.findFirst();
  }

  static findLast() {
    return this.dataStore.findLast();
  }

  static findById(id) {
    return this.dataStore.findById(id);
  }
}

class EventsHandler extends ServerCode {
  constructor(options) {
    super();

    if (!options) {
      throw new Error('Events Handler options are not specified');
    }

    Object.assign(this, options);
  }
}

EventsHandler.forProvider = function(provider) {
  return function(target, options) {
    if (typeof target === 'object') {
      options = target;
    } else {
      options || (options = {});
      options.target = target;
    }

    options.provider = provider;

    return new EventsHandler(options);
  }
};

exports.EventsHandler = EventsHandler;

/**
 * @type {PersistenceItem}
 */
exports.PersistenceItem = PersistenceItem;
exports.Service = Service;
exports.ServerCode = ServerCode;
exports.persistenceEventsHandler = EventsHandler.persistence = EventsHandler.forProvider(providers.DATA);
exports.fileEventsHandler = EventsHandler.file = EventsHandler.forProvider(providers.FILE);
exports.geoEventsHandler = EventsHandler.geo = EventsHandler.forProvider(providers.GEO);
exports.messagingEventsHandler = EventsHandler.messaging = EventsHandler.forProvider(providers.MESSAGING);
exports.customEventHandler = EventsHandler.custom = EventsHandler.forProvider(providers.CUSTOM);
exports.mediaEventsHandler = EventsHandler.media = EventsHandler.forProvider(providers.MEDIA);
exports.userEventsHandler = EventsHandler.user = EventsHandler.forProvider(providers.USER);
exports.timer = EventsHandler.timer = EventsHandler.forProvider(providers.TIMER);