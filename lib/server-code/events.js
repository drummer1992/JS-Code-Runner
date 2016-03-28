'use strict';

class EventType {
  constructor(id, name, provider, args, rawResult) {
    Object.assign(this, { id, name, provider, args, rawResult });
  }
}

class EventProvider {
  constructor(id, targeted) {
    this.id = id;
    this.targeted = targeted;
    this.events = {};
  }
}

/**
 * @type {Object.<number, EventType>}
 */
const events = {};

const PERSISTENCE = new EventProvider('persistence', true),
      TIMER     = new EventProvider('timer', false),
      MEDIA     = new EventProvider('media', false),
      MESSAGING = new EventProvider('messaging', true),
      USER      = new EventProvider('user', false),
      FILE      = new EventProvider('file', false),
      GEO       = new EventProvider('geo', true),
      CUSTOM    = new EventProvider('custom', true);

function addEvent(id, name, provider, args, rawResult) {
  events[id] = provider.events[name] = new EventType(id, name, provider, args, rawResult);
}

//Data (Persistence Service) Events
addEvent(100, 'beforeCreate', PERSISTENCE, ['item']);
addEvent(101, 'afterCreate', PERSISTENCE, ['item', 'result']);
addEvent(102, 'beforeFindById', PERSISTENCE, ['itemId', 'relations']);
addEvent(103, 'afterFindById', PERSISTENCE, ['itemId', 'relations', 'result']);
addEvent(104, 'beforeLoadRelations', PERSISTENCE, ['itemId', 'entityName', 'relations']);
addEvent(105, 'afterLoadRelations', PERSISTENCE, ['itemId', 'entityName', 'relations', 'result']);
addEvent(106, 'beforeRemove', PERSISTENCE, ['itemId']);
addEvent(107, 'afterRemove', PERSISTENCE, ['itemId', 'result']);
addEvent(108, 'beforeUpdate', PERSISTENCE, ['item']);
addEvent(109, 'afterUpdate', PERSISTENCE, ['item', 'result']);
addEvent(110, 'beforeDescribe', PERSISTENCE, ['itemName']);
addEvent(111, 'afterDescribe', PERSISTENCE, ['itemName', 'result']);
addEvent(112, 'beforeFind', PERSISTENCE, ['query']);
addEvent(113, 'afterFind', PERSISTENCE, ['query', 'result']);
addEvent(114, 'beforeFirst', PERSISTENCE, []);
addEvent(115, 'afterFirst', PERSISTENCE, ['result']);
addEvent(116, 'beforeLast', PERSISTENCE, []);
addEvent(117, 'afterLast', PERSISTENCE, ['result']);
addEvent(118, 'beforeUpdateBulk', PERSISTENCE, ['tableName', 'whereClause', 'changes']);
addEvent(119, 'afterUpdateBulk', PERSISTENCE, ['tableName', 'whereClause', 'changes', 'result']);
addEvent(120, 'beforeRemoveBulk', PERSISTENCE, ['tableName', 'whereClause']);
addEvent(121, 'afterRemoveBulk', PERSISTENCE, ['tableName', 'whereClause', 'result']);

//User Events
addEvent(200, 'beforeLogin', USER, ['login', 'password']);
addEvent(201, 'afterLogin', USER, ['login', 'password', 'result']);
addEvent(202, 'beforeRegister', USER, ['user']);
addEvent(203, 'afterRegister', USER, ['user', 'result']);
addEvent(204, 'beforeUpdate', USER, ['user']);
addEvent(205, 'afterUpdate', USER, ['user', 'result']);
addEvent(206, 'beforeRemove', USER, ['userId']);
addEvent(207, 'afterRemove', USER, ['userId', 'result']);
addEvent(208, 'beforeDescribe', USER, []);
addEvent(209, 'afterDescribe', USER, ['result']);
addEvent(210, 'beforeRestorePassword', USER, ['email']);
addEvent(211, 'afterRestorePassword', USER, ['email', 'result']);
addEvent(212, 'beforeLogout', USER, []);
addEvent(213, 'afterLogout', USER, ['result']);
addEvent(214, 'beforeFind', USER, ['query']);
addEvent(215, 'afterFind', USER, [['query', 'result']]);
addEvent(216, 'beforeFindById', USER, ['userId', 'relations']);
addEvent(217, 'afterFindById', USER, ['userId', 'relations', 'result']);
addEvent(218, 'beforeUpdateBulk', USER, ['whereClause', 'changes']);
addEvent(219, 'afterUpdateBulk', USER, ['whereClause', 'changes', 'result']);
addEvent(220, 'beforeRemoveBulk', USER, ['whereClause']);
addEvent(221, 'afterRemoveBulk', USER, ['whereClause', 'result']);
addEvent(222, 'beforeEmailConfirmed', USER, ['confirmationKey']);
addEvent(223, 'afterEmailConfirmed', USER, ['confirmationKey', 'result']);
addEvent(224, 'beforeSocialLogin', USER, ['userProperties', 'notary']);
addEvent(225, 'afterSocialLogin', USER, ['userProperties', 'notary', 'result']);
addEvent(226, 'beforeSocialRegister', USER, ['userProperties', 'notary']);
addEvent(227, 'afterSocialRegister', USER, ['userProperties', 'notary', 'result']);

//Media Service Events
addEvent(300, 'acceptConnection', MEDIA, ['operationName', 'tubeName', 'accessGranted']);
addEvent(301, 'publishStarted', MEDIA, ['info']);
addEvent(302, 'publishFinished', MEDIA, ['info']);
addEvent(303, 'streamCreated', MEDIA, ['meta']);
addEvent(304, 'streamFinished', MEDIA, ['meta']);

//Geo Service Events
addEvent(402, 'beforeAddPoint', GEO, ['point']);
addEvent(403, 'afterAddPoint', GEO, ['point', 'result']);
addEvent(404, 'beforeUpdatePoint', GEO, ['point']);
addEvent(405, 'afterUpdatePoint', GEO, ['point', 'result']);
addEvent(406, 'beforeRemovePoint', GEO, ['pointId']);
addEvent(407, 'afterRemovePoint', GEO, ['pointId', 'result']);
addEvent(408, 'beforeGetCategories', GEO, []);
addEvent(409, 'afterGetCategories', GEO, ['result']);
addEvent(410, 'beforeGetPoints', GEO, ['query']);
addEvent(411, 'afterGetPoints', GEO, ['query', 'result']);
addEvent(412, 'beforeAddCategory', GEO, ['categoryName']);
addEvent(413, 'afterAddCategory', GEO, ['categoryName', 'result']);
addEvent(414, 'beforeDeleteCategory', GEO, ['categoryName']);
addEvent(415, 'afterDeleteCategory', GEO, ['categoryName', 'result']);
addEvent(416, 'beforeRelativeFind', GEO, ['query']);
addEvent(417, 'afterRelativeFind', GEO, ['query', 'result']);

//Messaging Events
addEvent(500, 'beforePublish', MESSAGING, ['message', 'publishOptions', 'deliveryOptions']);
addEvent(501, 'afterPublish', MESSAGING, ['message', 'publishOptions', 'deliveryOptions', 'result']);
addEvent(502, 'beforeSubscribe', MESSAGING, ['subscriptionId', 'channel', 'options']);
addEvent(503, 'afterSubscribe', MESSAGING, ['subscriptionId', 'channel', 'options', 'result']);
addEvent(504, 'beforeCancel', MESSAGING, ['subscriptionId']);
addEvent(505, 'afterCancel', MESSAGING, ['subscriptionId', 'result']);
addEvent(506, 'beforePoll', MESSAGING, ['subscriptionId']);
addEvent(507, 'afterPoll', MESSAGING, ['subscriptionId', 'result']);
addEvent(512, 'beforeDeviceRegistration', MESSAGING, ['registration']);
addEvent(513, 'afterDeviceRegistration', MESSAGING, ['registration', 'registrationId']);

//File Service Events
addEvent(600, 'beforeMoveToRepository', FILE, ['fileURL']);
addEvent(601, 'afterMoveToRepository', FILE, ['fileURL', 'result']);
addEvent(602, 'beforeDeleteFileOrDirectory', FILE, ['fileURL']);
addEvent(603, 'afterDeleteFileOrDirectory', FILE, ['fileURL', 'result']);
addEvent(604, 'beforeSaveFileFromByteArray', FILE, ['fileURL', 'overwrite']);
addEvent(605, 'afterSaveFileFromByteArray', FILE, ['fileURL', 'overwrite', 'result']);
addEvent(606, 'beforeCopyFileOrDirectory', FILE, ['source', 'target']);
addEvent(607, 'afterCopyFileOrDirectory', FILE, ['source', 'target', 'result']);
addEvent(608, 'beforeMoveFileOrDirectory', FILE, ['source', 'target']);
addEvent(609, 'afterMoveFileOrDirectory', FILE, ['source', 'target', 'result']);

//Timer Events
addEvent(800, 'execute', TIMER, []);

//Custom Events
addEvent(900, 'execute', CUSTOM, ['args', 'result'], true);

module.exports = {
  /**
   * @type {Object.<string, EventProvider>}
   */
  providers: { PERSISTENCE, TIMER, MEDIA, MESSAGING, USER, FILE, GEO, CUSTOM },

  /**
   * @param {number} id Event Id
   * @returns {EventType}
   */
  get(id) {
    return events[id];
  }
};