'use strict';

const ServerCode = require('./base');
const Service = require('./service');
const PersistenceItem = require('./persistence-item');
const EventsHandler = require('./events-handler');

module.exports = ServerCode;

ServerCode.Service = Service;
ServerCode.EventsHandler = EventsHandler;
ServerCode.PersistenceItem = PersistenceItem;
ServerCode.persistenceEventsHandler = EventsHandler.persistence;
ServerCode.fileEventsHandler = EventsHandler.file;
ServerCode.geoEventsHandler = EventsHandler.geo;
ServerCode.messagingEventsHandler = EventsHandler.messaging;
ServerCode.customEventHandler = EventsHandler.custom;
ServerCode.mediaEventsHandler = EventsHandler.media;
ServerCode.userEventsHandler = EventsHandler.user;
ServerCode.timer = EventsHandler.timer;