"use strict";

function unwrapHandle(handle) {
  var sync = handle === EventHandler.sync;

  return {sync: sync, delegate: sync ? handle() : handle};
}

var EventHandler = function(service, target, eventsMap) {
  this.service = service;
  this.target = target;
  this.eventsMap = eventsMap;

  for (let key of Object.keys(eventsMap)) {
    eventsMap[key] = unwrapHandle(eventsMap[key]);
  }
};

EventHandler.prototype.processEvent = function(event, context, request, response) {
  var handler = this.eventsMap[event];

  if (!handler)
    throw new Error(`No registered ${event} handles`);

  handler.delegate.call(this.eventsMap, context, request, response);
};

EventHandler.sync = function(handler) {
  return handler;
};

module.exports = EventHandler;