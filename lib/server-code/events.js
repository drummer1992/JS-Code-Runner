"use strict";

class EventType {
  constructor(id, name, provider) {
    Object.assign(this, {id, name, provider});
  }
}

class EventProvider {
  constructor(id, targeted) {
    if (arguments.length === 1) {
      targeted = true;
    }

    Object.assign(this, {id, targeted});
  }
}

const DATA      = new EventProvider('data'),
      TIMER     = new EventProvider('timer', false),
      MEDIA     = new EventProvider('media', false),
      MESSAGING = new EventProvider('messaging'),
      USER      = new EventProvider('user', false),
      FILE      = new EventProvider('file', false),
      GEO       = new EventProvider('geo'),
      CUSTOM    = new EventProvider('custom');

const eventTypes = [
  new EventType(100, 'beforeCreate', DATA),
  new EventType(101, 'afterCreate', DATA),
  new EventType(102, 'beforeFindById', DATA),
  new EventType(103, 'afterFindById', DATA),
  new EventType(104, 'beforeLoadRelations', DATA),
  new EventType(105, 'afterLoadRelations', DATA),
  new EventType(106, 'beforeRemove', DATA),
  new EventType(107, 'afterRemove', DATA),
  new EventType(108, 'beforeUpdate', DATA),
  new EventType(109, 'afterUpdate', DATA),
  new EventType(110, 'beforeDescribe', DATA),
  new EventType(111, 'afterDescribe', DATA),
  new EventType(112, 'beforeFind', DATA),
  new EventType(113, 'afterFind', DATA),
  new EventType(114, 'beforeFirst', DATA),
  new EventType(115, 'afterFirst', DATA),
  new EventType(116, 'beforeLast', DATA),
  new EventType(117, 'afterLast', DATA),
  new EventType(118, 'beforeUpdateBulk', DATA),
  new EventType(119, 'afterUpdateBulk', DATA),
  new EventType(120, 'beforeRemoveBulk', DATA),
  new EventType(121, 'afterRemoveBuld', DATA),

  new EventType(200, 'beforeLogin', USER),
  new EventType(201, 'afterLogin', USER),
  new EventType(202, 'beforeRegister', USER),
  new EventType(203, 'afterRegister', USER),
  new EventType(204, 'beforeUpdate', USER),
  new EventType(205, 'afterUpdate', USER),
  new EventType(206, 'beforeRemove', USER),
  new EventType(207, 'afterRemove', USER),
  new EventType(208, 'beforeDescribe', USER),
  new EventType(209, 'afterDescribe', USER),
  new EventType(210, 'beforeRestorePassword', USER),
  new EventType(211, 'afterRestorePassword', USER),
  new EventType(212, 'beforeLogout', USER),
  new EventType(213, 'afterLogout', USER),
  new EventType(214, 'beforeFind', USER),
  new EventType(215, 'afterFind', USER),
  new EventType(216, 'beforeFindById', USER),
  new EventType(217, 'afterFindById', USER),
  new EventType(218, 'beforeUpdateBulk', USER),
  new EventType(219, 'afterUpdateBulk', USER),
  new EventType(220, 'beforeRemoveBulk', USER),
  new EventType(221, 'afterRemoveBulk', USER),
  new EventType(222, 'beforeEmailConfirmed', USER),
  new EventType(223, 'afterEmailConfirmed', USER),

  new EventType(300, 'acceptConnection', MEDIA),
  new EventType(301, 'publishStarted', MEDIA),
  new EventType(302, 'publishFinished', MEDIA),
  new EventType(303, 'streamCreated', MEDIA),
  new EventType(304, 'streamFinished', MEDIA),

  new EventType(402, 'beforeAddPoint', GEO),
  new EventType(403, 'afterAddPoint', GEO),
  new EventType(404, 'beforeUpdatePoint', GEO),
  new EventType(405, 'afterUpdatePoint', GEO),
  new EventType(406, 'beforeRemovePoint', GEO),
  new EventType(407, 'afterRemovePoint', GEO),
  new EventType(408, 'beforeGetCategories', GEO),
  new EventType(409, 'afterGetCategories', GEO),
  new EventType(410, 'beforeGetPoints', GEO),
  new EventType(411, 'afterGetPoints', GEO),
  new EventType(412, 'beforeAddCategory', GEO),
  new EventType(413, 'afterAddCategory', GEO),
  new EventType(414, 'beforeDeleteCategory', GEO),
  new EventType(415, 'afterDeleteCategory', GEO),
  new EventType(416, 'beforeRelativeFind', GEO),
  new EventType(417, 'afterRelativeFind', GEO),

  new EventType(500, 'beforePublish', MESSAGING),
  new EventType(501, 'afterPublish', MESSAGING),
  new EventType(502, 'beforeSubscribe', MESSAGING),
  new EventType(503, 'afterSubscribe', MESSAGING),
  new EventType(504, 'beforeCancel', MESSAGING),
  new EventType(505, 'afterCancel', MESSAGING),
  new EventType(506, 'beforePoll', MESSAGING),
  new EventType(507, 'afterPoll', MESSAGING),
  new EventType(512, 'beforeDeviceRegistration', MESSAGING),
  new EventType(513, 'afterDeviceRegistration', MESSAGING),

  new EventType(600, 'beforeMoveToRepository', FILE),
  new EventType(601, 'afterMoveToRepository', FILE),
  new EventType(602, 'beforeDeleteFileOrDirectory', FILE),
  new EventType(603, 'afterDeleteFileOrDirectory', FILE),
  new EventType(604, 'beforeSaveFileFromByteArray', FILE),
  new EventType(605, 'afterSaveFileFromByteArray', FILE),
  new EventType(606, 'beforeCopyFileOrDirectory', FILE),
  new EventType(607, 'afterCopyFileOrDirectory', FILE),
  new EventType(608, 'beforeMoveFileOrDirectory', FILE),
  new EventType(609, 'afterMoveFileOrDirectory', FILE),

  new EventType(800, 'execute', TIMER),

  new EventType(900, 'handleEvent', CUSTOM)
];

const providers = {DATA, TIMER, MEDIA, MESSAGING, USER, FILE, GEO, CUSTOM};
const typesById = {};
const typesByProvider = {};

eventTypes.forEach(event => {
  typesById[event.id] = event;
  typesByProvider[event.provider.id] || (typesByProvider[event.provider.id] = {});
  typesByProvider[event.provider.id][event.name] = event;
});

module.exports = {
  providers: providers,

  types: {
    byId      : typesById,
    byProvider: typesByProvider
  }
};