'use strict';

const logger = require('../../util/logger'),
      events = require('../events');

function describeHandler(handler) {
  const event = events.get(handler.eventId);
  const provider = event.provider;
  const custom = provider === events.providers.CUSTOM;
  const args = [];

  if (!custom && provider.targeted) {
    args.push(handler.target);
  }

  if (handler.async) {
    args.push('async');
  }

  const eventName = custom ? handler.target : event.name;
  const argsString = args.length ? `(${args.join(', ')})` : '';

  return `${event.provider.id}.${eventName} ${argsString} (${handler.file})`;
}

function describeTimer(timer) {
  const parsed = JSON.parse(timer.target);

  return `${parsed.timername} (${timer.file})`;
}

function describeError(error) {
  return `${error.message} (${error.erredFile})`;
}

function describeCustomType(type) {
  return `${type.name} (${type.file})`;
}

function groupHandlers(handlers) {
  const timers = [], nonTimers = [];

  handlers.forEach(h => (h.timer ? timers : nonTimers).push(h));

  return { timers, nonTimers };
}

function printGroup(groupName, items, itemDescriptor) {
  if (items.length) {
    logger.info(`${groupName} (${items.length}):`);
    items.forEach(item => logger.info(`  ${itemDescriptor(item)}`));
  }
}

/**
 * @param {ServerCodeModel} model
 */
exports.print = function(model) {
  if (model.isEmpty()) {
    logger.info('Model is empty');
    return;
  }

  const handlersGroup = groupHandlers(model.handlers.values());

  printGroup('Event handlers', handlersGroup.nonTimers, describeHandler);
  printGroup('Timers', handlersGroup.timers, describeTimer);
  printGroup('Custom Types', model.types.values(), describeCustomType);
  printGroup('Services', model.services.values(), describeCustomType);
  printGroup('Errors', model.errors, describeError);
};