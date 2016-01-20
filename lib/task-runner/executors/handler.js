"use strict";

var moduleLoader = require('./module-loader');

function execute(event, handlerPath, context, request, response) {
  var eventHandler = moduleLoader.load(handlerPath);

  return eventHandler.processEvent(event, context, request, response);
}

module.exports = execute;