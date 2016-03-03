'use strict';

const ServerCode = require('./base');
const providers = require('../events').providers;

class EventsHandler extends ServerCode {
  constructor(options) {
    super();

    if (!options) {
      throw new Error('Events Handler options are not specified');
    }

    Object.assign(this, options);
  }

  static forProvider(provider) {
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
  }
}

EventsHandler.persistence = EventsHandler.forProvider(providers.DATA);
EventsHandler.file = EventsHandler.forProvider(providers.FILE);
EventsHandler.geo = EventsHandler.forProvider(providers.GEO);
EventsHandler.messaging = EventsHandler.forProvider(providers.MESSAGING);
EventsHandler.custom = EventsHandler.forProvider(providers.CUSTOM);
EventsHandler.media = EventsHandler.forProvider(providers.MEDIA);
EventsHandler.user = EventsHandler.forProvider(providers.USER);
EventsHandler.timer = EventsHandler.forProvider(providers.TIMER);

module.exports = EventsHandler;