"use strict";

class EventType {
  constructor(id, name, provider, args) {
    Object.assign(this, {id, name, provider, args});
  }
}

class EventProvider {
  constructor(id, targeted) {
    arguments.length === 1 && (targeted = true); //targeted is true if not defined

    Object.assign(this, {id, targeted});
  }
}

/**
 * @type {Object.<number, EventType>}
 */
const events = {};

const DATA      = new EventProvider('data'),
      TIMER     = new EventProvider('timer', false),
      MEDIA     = new EventProvider('media', false),
      MESSAGING = new EventProvider('messaging'),
      USER      = new EventProvider('user', false),
      FILE      = new EventProvider('file', false),
      GEO       = new EventProvider('geo'),
      CUSTOM    = new EventProvider('custom');

function addEvent(id, name, provider, args) {
  events[id] = provider[name] = new EventType(id, name, provider, args);
}

//Data (Persistence Service) Events
addEvent(100, 'beforeCreate', DATA, ['item']);
addEvent(101, 'afterCreate', DATA, ['item', 'result']);
addEvent(102, 'beforeFindById', DATA, ['itemId', 'relations']);
addEvent(103, 'afterFindById', DATA, ['itemId', 'relations', 'result']);
addEvent(104, 'beforeLoadRelations', DATA, ['itemId', 'entityName', 'relations']);
addEvent(105, 'afterLoadRelations', DATA, ['itemId', 'entityName', 'relations', 'result']);
addEvent(106, 'beforeRemove', DATA, ['itemId']);
addEvent(107, 'afterRemove', DATA, ['itemId', 'result']);
addEvent(108, 'beforeUpdate', DATA, ['item']);
addEvent(109, 'afterUpdate', DATA, ['item', 'result']);
addEvent(110, 'beforeDescribe', DATA, ['itemName']);
addEvent(111, 'afterDescribe', DATA, ['itemName', 'result']);
addEvent(112, 'beforeFind', DATA, ['query']);
addEvent(113, 'afterFind', DATA, ['query', 'result']);
addEvent(114, 'beforeFirst', DATA, []);
addEvent(115, 'afterFirst', DATA, ['result']);
addEvent(116, 'beforeLast', DATA, []);
addEvent(117, 'afterLast', DATA, ['result']);
addEvent(118, 'beforeUpdateBulk', DATA, ['tableName', 'whereClause', 'changes']);
addEvent(119, 'afterUpdateBulk', DATA, ['tableName', 'whereClause', 'changes', 'result']);
addEvent(120, 'beforeRemoveBulk', DATA, ['tableName', 'whereClause']);
addEvent(121, 'afterRemoveBulk', DATA, ['tableName', 'whereClause', 'result']);

//User Events
addEvent(200, 'beforeLogin', USER);
addEvent(201, 'afterLogin', USER);
addEvent(202, 'beforeRegister', USER);
addEvent(203, 'afterRegister', USER);
addEvent(204, 'beforeUpdate', USER);
addEvent(205, 'afterUpdate', USER);
addEvent(206, 'beforeRemove', USER);
addEvent(207, 'afterRemove', USER);
addEvent(208, 'beforeDescribe', USER);
addEvent(209, 'afterDescribe', USER);
addEvent(210, 'beforeRestorePassword', USER);
addEvent(211, 'afterRestorePassword', USER);
addEvent(212, 'beforeLogout', USER);
addEvent(213, 'afterLogout', USER);
addEvent(214, 'beforeFind', USER);
addEvent(215, 'afterFind', USER);
addEvent(216, 'beforeFindById', USER);
addEvent(217, 'afterFindById', USER);
addEvent(218, 'beforeUpdateBulk', USER);
addEvent(219, 'afterUpdateBulk', USER);
addEvent(220, 'beforeRemoveBulk', USER);
addEvent(221, 'afterRemoveBulk', USER);
addEvent(222, 'beforeEmailConfirmed', USER);
addEvent(223, 'afterEmailConfirmed', USER);

//Media Service Events
addEvent(300, 'acceptConnection', MEDIA);
addEvent(301, 'publishStarted', MEDIA);
addEvent(302, 'publishFinished', MEDIA);
addEvent(303, 'streamCreated', MEDIA);
addEvent(304, 'streamFinished', MEDIA);

//Geo Service Events
addEvent(402, 'beforeAddPoint', GEO);
addEvent(403, 'afterAddPoint', GEO);
addEvent(404, 'beforeUpdatePoint', GEO);
addEvent(405, 'afterUpdatePoint', GEO);
addEvent(406, 'beforeRemovePoint', GEO);
addEvent(407, 'afterRemovePoint', GEO);
addEvent(408, 'beforeGetCategories', GEO);
addEvent(409, 'afterGetCategories', GEO);
addEvent(410, 'beforeGetPoints', GEO);
addEvent(411, 'afterGetPoints', GEO);
addEvent(412, 'beforeAddCategory', GEO);
addEvent(413, 'afterAddCategory', GEO);
addEvent(414, 'beforeDeleteCategory', GEO);
addEvent(415, 'afterDeleteCategory', GEO);
addEvent(416, 'beforeRelativeFind', GEO);
addEvent(417, 'afterRelativeFind', GEO);

//Messaging Events
addEvent(500, 'beforePublish', MESSAGING);
addEvent(501, 'afterPublish', MESSAGING);
addEvent(502, 'beforeSubscribe', MESSAGING);
addEvent(503, 'afterSubscribe', MESSAGING);
addEvent(504, 'beforeCancel', MESSAGING);
addEvent(505, 'afterCancel', MESSAGING);
addEvent(506, 'beforePoll', MESSAGING);
addEvent(507, 'afterPoll', MESSAGING);
addEvent(512, 'beforeDeviceRegistration', MESSAGING);
addEvent(513, 'afterDeviceRegistration', MESSAGING);

//File Service Events
addEvent(600, 'beforeMoveToRepository', FILE);
addEvent(601, 'afterMoveToRepository', FILE);
addEvent(602, 'beforeDeleteFileOrDirectory', FILE);
addEvent(603, 'afterDeleteFileOrDirectory', FILE);
addEvent(604, 'beforeSaveFileFromByteArray', FILE);
addEvent(605, 'afterSaveFileFromByteArray', FILE);
addEvent(606, 'beforeCopyFileOrDirectory', FILE);
addEvent(607, 'afterCopyFileOrDirectory', FILE);
addEvent(608, 'beforeMoveFileOrDirectory', FILE);
addEvent(609, 'afterMoveFileOrDirectory', FILE);

//Timer Events
addEvent(800, 'execute', TIMER);

//Custom Events
addEvent(900, 'handleEvent', CUSTOM);

module.exports = {
  /**
   * @type {Object.<string, EventProvider>}
   */
  providers: {DATA, TIMER, MEDIA, MESSAGING, USER, FILE, GEO, CUSTOM},

  /**
   * @param {number} id
   * @returns {EventType}
   */
  get(id) {
    return events[id];
  }
};