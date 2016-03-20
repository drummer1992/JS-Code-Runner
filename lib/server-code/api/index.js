'use strict';

const path            = require('path'),
      Module          = require('module'),
      Backendless     = require('backendless'),
      logger          = require('../../util/logger'),
      PersistenceItem = require('./persistence-item'),
      events          = require('../events'),
      providers       = events.providers,
      PERSISTENCE     = providers.PERSISTENCE,
      MESSAGING       = providers.MESSAGING,
      MEDIA           = providers.MEDIA,
      GEO             = providers.GEO,
      USER            = providers.USER,
      FILE            = providers.FILE,
      TIMER           = providers.TIMER,
      CUSTOM          = providers.CUSTOM,
      nodeRequire     = Module.prototype.require;

let contextModel;

const contexts = [];

function contextFile() {
  return contexts[contexts.length - 1];
}

function contextGuarded(apiMethod) {
  return function() {
    const file = contextFile();

    if (file && contextModel) {
      return apiMethod.apply(ServerCode, arguments);
    } else {
      logger.error('ServerCode registration is allowed only synchronously during module load phase');
    }
  };
}

function addHandler(eventId, target, async, invoke, timer) {
  contextModel.addHandler({ eventId, target, async, invoke, timer: !!timer, file: contextFile() });
}

class ServerCodeError extends Error{

  /**
   * @param {Number} code
   * @param {String} message
   */
  constructor(code, message) {
    super(message);

    this.code = code;
    this.message = message;
  }
}

/**
 * @namespace
 * @alias Backendless.ServerCode
 */
const ServerCode = {};

ServerCode.Error = ServerCodeError;

ServerCode.PersistenceItem = PersistenceItem;

/**
 * @param {Function} type
 * @returns {Function} Passed type
 */
ServerCode.addType = contextGuarded(function(type) {
  if (!type || typeof type != 'function' || !type.name) {
    throw new Error('A type must be a named function-constructor or es6 class');
  }

  contextModel.addType(type, contextFile());

  return type;
});

/**
 * @typedef {String|Number|Date} DateTime
 */

/**
 * @typedef {Object} Timer
 * @param {String} timer.name
 * @param {?DateTime} timer.startDate
 * @param {Object} timer.frequency
 * @param {?DateTime} timer.expire
 */

/**
 * @name Backendless.ServerCode.addTimer
 *
 * @param {Timer} timer
 */
ServerCode.addTimer = contextGuarded(function(timer) {
  const event = TIMER.events.execute;
  const handler = timer[event.name];

  const fileName = contextFile();

  const timername = timer.name || timer.timername || path.basename(fileName, '.js');
  const frequency = timer.frequency || {};
  const schedule = frequency.schedule;
  let startDate = timer.startDate;
  let expire = timer.expire;

  if (!handler) {
    throw new Error(`${timername} timer must contain [${event.name}}] method`);
  }

  const now = new Date().getTime();
  const singleTick = schedule === 'once';

  if (startDate) {
    startDate = new Date(startDate).getTime();

    if (startDate < now && singleTick) {
      throw new Error(`${timername} timer is scheduled to run only once but its [startDate] is in the past`);
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

  const target = JSON.stringify({ timername, startDate, expire, frequency });

  addHandler(event.id, target, true, handler, true);
});

/**
 * @param {String} eventName
 * @param {Function} handler
 * @param {Boolean} async
 */
ServerCode.customEvent = contextGuarded((eventName, handler, async) => {
  addHandler(CUSTOM.events.execute.id, eventName, async, handler);
});

/**
 * @param {Function} service
 * @returns {Function} Passed service
 */
ServerCode.addService = contextGuarded((service) => {
  if (!service || typeof service !== 'function' || !service.name) {
    throw new Error('A Service must be a named function-constructor or es6 class');
  }

  contextModel.addService(service, contextFile());

  return service;
});

// It tempts to generate all these handlers dynamically but in that case user's IDE won't be able
// to perform some code completion

ServerCode.Persistence = {
  beforeCreate       : handlerRegistrar(PERSISTENCE.events.beforeCreate),
  afterCreate        : handlerRegistrar(PERSISTENCE.events.afterCreate),
  beforeFindById     : handlerRegistrar(PERSISTENCE.events.beforeFindById),
  afterFindById      : handlerRegistrar(PERSISTENCE.events.afterFindById),
  beforeLoadRelations: handlerRegistrar(PERSISTENCE.events.beforeLoadRelations),
  afterLoadRelations : handlerRegistrar(PERSISTENCE.events.afterLoadRelations),
  beforeRemove       : handlerRegistrar(PERSISTENCE.events.beforeRemove),
  afterRemove        : handlerRegistrar(PERSISTENCE.events.afterRemove),
  beforeUpdate       : handlerRegistrar(PERSISTENCE.events.beforeUpdate),
  afterUpdate        : handlerRegistrar(PERSISTENCE.events.afterUpdate),
  beforeDescribe     : handlerRegistrar(PERSISTENCE.events.beforeDescribe),
  afterDescribe      : handlerRegistrar(PERSISTENCE.events.afterDescribe),
  beforeFind         : handlerRegistrar(PERSISTENCE.events.beforeFind),
  afterFind          : handlerRegistrar(PERSISTENCE.events.afterFind),
  beforeFirst        : handlerRegistrar(PERSISTENCE.events.beforeFirst),
  afterFirst         : handlerRegistrar(PERSISTENCE.events.afterFirst),
  beforeLast         : handlerRegistrar(PERSISTENCE.events.beforeLast),
  afterLast          : handlerRegistrar(PERSISTENCE.events.afterLast),
  beforeUpdateBulk   : handlerRegistrar(PERSISTENCE.events.beforeUpdateBulk),
  afterUpdateBulk    : handlerRegistrar(PERSISTENCE.events.afterUpdateBulk),
  beforeRemoveBulk   : handlerRegistrar(PERSISTENCE.events.beforeRemoveBulk),
  afterRemoveBulk    : handlerRegistrar(PERSISTENCE.events.afterRemoveBulk)
};

ServerCode.User = {
  beforeLogin          : handlerRegistrar(USER.events.beforeLogin),
  afterLogin           : handlerRegistrar(USER.events.afterLogin),
  beforeRegister       : handlerRegistrar(USER.events.beforeRegister),
  afterRegister        : handlerRegistrar(USER.events.afterRegister),
  beforeUpdate         : handlerRegistrar(USER.events.beforeUpdate),
  afterUpdate          : handlerRegistrar(USER.events.afterUpdate),
  beforeRemove         : handlerRegistrar(USER.events.beforeRemove),
  afterRemove          : handlerRegistrar(USER.events.afterRemove),
  beforeDescribe       : handlerRegistrar(USER.events.beforeDescribe),
  afterDescribe        : handlerRegistrar(USER.events.afterDescribe),
  beforeRestorePassword: handlerRegistrar(USER.events.beforeRestorePassword),
  afterRestorePassword : handlerRegistrar(USER.events.afterRestorePassword),
  beforeLogout         : handlerRegistrar(USER.events.beforeLogout),
  afterLogout          : handlerRegistrar(USER.events.afterLogout),
  beforeFind           : handlerRegistrar(USER.events.beforeFind),
  afterFind            : handlerRegistrar(USER.events.afterFind),
  beforeFindById       : handlerRegistrar(USER.events.beforeFindById),
  afterFindById        : handlerRegistrar(USER.events.afterFindById),
  beforeUpdateBulk     : handlerRegistrar(USER.events.beforeUpdateBulk),
  afterUpdateBulk      : handlerRegistrar(USER.events.afterUpdateBulk),
  beforeRemoveBulk     : handlerRegistrar(USER.events.beforeRemoveBulk),
  afterRemoveBulk      : handlerRegistrar(USER.events.afterRemoveBulk),
  beforeEmailConfirmed : handlerRegistrar(USER.events.beforeEmailConfirmed),
  afterEmailConfirmed  : handlerRegistrar(USER.events.afterEmailConfirmed)
};

ServerCode.Media = {
  acceptConnection: handlerRegistrar(MEDIA.events.acceptConnection),
  publishStarted  : handlerRegistrar(MEDIA.events.publishStarted),
  publishFinished : handlerRegistrar(MEDIA.events.publishFinished),
  streamCreated   : handlerRegistrar(MEDIA.events.streamCreated),
  streamFinished  : handlerRegistrar(MEDIA.events.streamFinished)
};

ServerCode.Geo = {
  beforeAddPoint      : handlerRegistrar(GEO.events.beforeAddPoint),
  afterAddPoint       : handlerRegistrar(GEO.events.afterAddPoint),
  beforeUpdatePoint   : handlerRegistrar(GEO.events.beforeUpdatePoint),
  afterUpdatePoint    : handlerRegistrar(GEO.events.afterUpdatePoint),
  beforeRemovePoint   : handlerRegistrar(GEO.events.beforeRemovePoint),
  afterRemovePoint    : handlerRegistrar(GEO.events.afterRemovePoint),
  beforeGetCategories : handlerRegistrar(GEO.events.beforeGetCategories),
  afterGetCategories  : handlerRegistrar(GEO.events.afterGetCategories),
  beforeGetPoints     : handlerRegistrar(GEO.events.beforeGetPoints),
  afterGetPoints      : handlerRegistrar(GEO.events.afterGetPoints),
  beforeAddCategory   : handlerRegistrar(GEO.events.beforeAddCategory),
  afterAddCategory    : handlerRegistrar(GEO.events.afterAddCategory),
  beforeDeleteCategory: handlerRegistrar(GEO.events.beforeDeleteCategory),
  afterDeleteCategory : handlerRegistrar(GEO.events.afterDeleteCategory),
  beforeRelativeFind  : handlerRegistrar(GEO.events.beforeRelativeFind),
  afterRelativeFind   : handlerRegistrar(GEO.events.afterRelativeFind)
};

ServerCode.Messaging = {
  beforePublish           : handlerRegistrar(MESSAGING.events.beforePublish),
  afterPublish            : handlerRegistrar(MESSAGING.events.afterPublish),
  beforeSubscribe         : handlerRegistrar(MESSAGING.events.beforeSubscribe),
  afterSubscribe          : handlerRegistrar(MESSAGING.events.afterSubscribe),
  beforeCancel            : handlerRegistrar(MESSAGING.events.beforeCancel),
  afterCancel             : handlerRegistrar(MESSAGING.events.afterCancel),
  beforePoll              : handlerRegistrar(MESSAGING.events.beforePoll),
  afterPoll               : handlerRegistrar(MESSAGING.events.afterPoll),
  beforeDeviceRegistration: handlerRegistrar(MESSAGING.events.beforeDeviceRegistration),
  afterDeviceRegistration : handlerRegistrar(MESSAGING.events.afterDeviceRegistration)
};

ServerCode.File = {
  beforeMoveToRepository     : handlerRegistrar(FILE.events.beforeMoveToRepository),
  afterMoveToRepository      : handlerRegistrar(FILE.events.afterMoveToRepository),
  beforeDeleteFileOrDirectory: handlerRegistrar(FILE.events.beforeDeleteFileOrDirectory),
  afterDeleteFileOrDirectory : handlerRegistrar(FILE.events.afterDeleteFileOrDirectory),
  beforeSaveFileFromByteArray: handlerRegistrar(FILE.events.beforeSaveFileFromByteArray),
  afterSaveFileFromByteArray : handlerRegistrar(FILE.events.afterSaveFileFromByteArray),
  beforeCopyFileOrDirectory  : handlerRegistrar(FILE.events.beforeCopyFileOrDirectory),
  afterCopyFileOrDirectory   : handlerRegistrar(FILE.events.afterCopyFileOrDirectory),
  beforeMoveFileOrDirectory  : handlerRegistrar(FILE.events.beforeMoveFileOrDirectory),
  afterMoveFileOrDirectory   : handlerRegistrar(FILE.events.afterMoveFileOrDirectory)
};

function handlerRegistrar(event) {
  return function() {
    const targeted = typeof arguments[0] !== 'function';

    const target = targeted ? arguments[0] : '*';
    const handler = arguments[targeted ? 1 : 0];
    const async = !!arguments[targeted ? 2 : 1];

    addHandler(event.id, target, async, handler);
  };
}

ServerCode.load = function(basePath, files, model) {
  contextModel = model;

  files.forEach(file => {
    const filePath = path.resolve(file);

    logger.debug(`Reading ${file}...`);

    Module.prototype.require = contextifyRequire(basePath);

    try {
      require(filePath);
    } catch (e) {
      logger.error(`Error: ${e.message}`);

      contextModel.addError(e, file, contextFile());
    }

    Module.prototype.require = nodeRequire;
  });

  contextModel = null;
};

function contextifyRequire(basePath) {
  return function(modulePath) {
    if (modulePath === 'backendless') {
      return Backendless;
    }

    let context = Module._resolveFilename(modulePath, this);

    if (context.startsWith(basePath)) {
      context = context.substring(basePath.length + 1);
    }

    contexts.push(context);

    const result = nodeRequire.call(this, modulePath);

    contexts.pop();

    return result;
  };
}

module.exports = ServerCode;