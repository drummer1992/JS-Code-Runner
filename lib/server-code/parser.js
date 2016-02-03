'use strict';

const api    = require('./api'),
      events = require('./events'),
      path   = require('path');

function parseHandler(handler, fileName) {
  if (!handler.provider) {
    throw new Error('Events Provider is not specified');
  }

  if (!handler.target && handler.provider.targeted) {
    throw new Error('Target is required for ' + handler.provider.id);
  }

  let handlerEvents = [];
  let timer;

  if (handler.provider == events.providers.TIMER) {
    timer = parseTimer(handler, fileName);
  }

  Object.keys(handler).forEach(key => {
    let async = key.endsWith('Async');
    let event = async ? key.substring(0, key.length - 5) : key;
    let eventType = handler.provider[event];

    if (eventType) {
      handlerEvents.push({
        id      : eventType.id,
        async   : timer ? true : async,
        timer   : !!timer,
        target  : timer && JSON.stringify(timer) || handler.target,
        provider: fileName
      });
    }
  });

  return handlerEvents;
}

function parseTimer(timer, fileName) {
  let timername = timer.name || timer.timername || path.basename(fileName, '.js'),
      startDate = timer.startDate,
      expire    = timer.expire,
      frequency = timer.frequency || {},
      schedule  = frequency.schedule;

  const now = new Date().getTime();
  const singleTick = schedule === 'once';

  if (startDate) {
    startDate = new Date(startDate).getTime();

    if (startDate < now && singleTick) {
      throw new Error(`${timername} timer is scheduled to run only once its [startDate] is in the past`);
    }
  } else if (singleTick) {
    throw new Error(`${timername} timer is scheduled to run only once but its [startDate] is not specified`);
  } else {
    startDate = now;
  }

  if (expire) {
    expire = new Date(expire).getTime();

    if (expire < now) {
      throw new Error(`${timername} timer already expired`);
    }
  }

  return {timername, startDate, expire, frequency};
}

//noinspection Eslint
function parseService(service) {
  //TODO: implement me
}

exports.parse = function(serverCode, fileName) {
  return {
    handlers: (serverCode instanceof api.EventsHandler) && parseHandler(serverCode, fileName) || [],
    service : (serverCode instanceof api.Service) && parseService(serverCode, fileName) || null
  };
};