"use strict";

const providers = require('./events').providers;

class ServerCode {
}

class Service extends ServerCode {
}

//noinspection Eslint
Service.create = function(name, mappings) {

};

class EventsHandler extends ServerCode {
  constructor(options) {
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
exports.Service = Service;
exports.ServerCode = ServerCode;
exports.persistenceEventsHandler = EventsHandler.persistence = EventsHandler.forProvider(providers.DATA);
exports.fileEventsHandler = EventsHandler.file = EventsHandler.forProvider(providers.FILE);
exports.geoEventsHandler = EventsHandler.geo = EventsHandler.forProvider(providers.GEO);
exports.messagingEventsHandler = EventsHandler.messaging = EventsHandler.forProvider(providers.MESSAGING);
exports.customEventsHandler = EventsHandler.custom = EventsHandler.forProvider(providers.CUSTOM);
exports.mediaEventsHandler = EventsHandler.media = EventsHandler.forProvider(providers.MEDIA);
exports.userEventsHandler = EventsHandler.user = EventsHandler.forProvider(providers.USER);
exports.timer = EventsHandler.timer = EventsHandler.forProvider(providers.TIMER);
