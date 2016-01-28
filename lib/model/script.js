//"use strict";
//
//const logger        = require('../util/logger'),
//      EventsHandler = require('../api').EventsHandler,
//      events        = require('./events');
//
//class Script {
//  constructor(file) {
//    this.file = file;
//    this.module = require(file).exports;
//  }
//
//  isServerCode() {
//    return this.module instanceof Function
//      && module.length === 1
//      && module.toString().indexOf('.serverCode.') !== -1;
//  }
//}
//
//module.exports = Script;
//
//Script.analyse = function(fileName) {
//  function logReading(err) {
//    logger.debug(`Reading ${fileName}...${err ? 'Error' : 'OK'}`);
//    err && logger.error(`Error: ${err.message || err}`);
//  }
//
//  let script = refileName);
//  let serverCodeLikeness =
//
//  return new Promise((resolve, reject)=> {
//
//
//    try {
//
//      logReading();
//
//      if (script.isServerCode()) {
//
//      }
//    } catch (e) {
//      logReading(e);
//      throw e;
//    }
//
//  });
//
//  return this.load(fileName)
//    .then((module)=> {
//
//      if (isServerCode(module)) {
//
//      }
//
//      if (module instanceof EventsHandler) {
//        logger.debug(`${fileName} -> Business Logic found`);
//
//        try {
//          return parseHandler(module, fileName);
//        } catch (e) {
//          logger.error(`Validation Error: ${e.message}`);
//          return Promise.reject(e);
//        }
//      } else {
//        logger.debug(`${fileName} -> No Business Logic found`);
//        return [];
//      }
//    }, err => {
//      logReading(err);
//      return Promise.reject(err);
//    });
//};
//
//function isServerCode(module) {
//  return module instanceof Function
//    && module.length === 1
//    && module.toString().indexOf('.serverCode.') !== -1;
//}
//
//function parseHandler(handler, fileName) {
//  if (!handler.provider) {
//    throw new Error('Events Provider is not specified');
//  }
//
//  let providerEvents = events.types.byProvider[handler.provider.id];
//  if (!providerEvents) {
//    throw new Error('Unknown Events Provider: ' + handler.provider.id);
//  }
//
//  if (!handler.target && handler.provider.targeted) {
//    throw new Error('Target is required for ' + handler.provider.id);
//  }
//
//  let handlerEvents = [];
//  let timer;
//
//  if (handler.provider == events.providers.TIMER) {
//    timer = parseTimer(handler);
//  }
//
//  Object.keys(handler).forEach(key => {
//    let async = !key.endsWith('Sync');
//    let event = async ? key : key.substring(0, key.length - 4);
//    let eventType = providerEvents[event];
//
//    if (eventType) {
//      handlerEvents.push({
//        id      : eventType.id,
//        async   : timer ? true : async,
//        isTimer : !!timer,
//        target  : timer || handler.target,
//        provider: fileName
//      });
//    }
//  });
//
//  return handlerEvents;
//}
//
//function parseTimer(timer) {
//  let timername = timer.name,
//      startDate = timer.startDate,
//      expire    = timer.expire,
//      frequency = timer.frequency || {},
//      schedule  = frequency.schedule;
//
//  const now = new Date().getTime();
//  const singleTick = schedule === 'once';
//
//  if (startDate) {
//    startDate = new Date(startDate).getTime();
//
//    if (startDate < now && singleTick) {
//      throw new Error(`${timername} timer is scheduled to run only once its [startDate] is in the past`);
//    }
//  } else if (singleTick) {
//    throw new Error(`${timername} timer is scheduled to run only once but its [startDate] is not specified`);
//  }
//
//  if (expire) {
//    expire = new Date(expire).getTime();
//
//    if (expire < now) {
//      throw new Error(`${timername} timer already expired`);
//    }
//  }
//
//  return {timername, startDate, expire, frequency};
//}