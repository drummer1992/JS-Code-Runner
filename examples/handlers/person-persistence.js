'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {Object} Server Coder Module
 */
module.exports = function(backendless) {

  return backendless.serverCode.persistenceEventsHandler('Person', {
    afterCreate(req) {
      console.log('afterCreate:person');

      req.item.innerItem = req.item;
    },

    beforeFind() {
      console.log('beforeFind:person');
    },

    afterFind() {
      console.log('afterFind:person');
    },

    beforeRemove() {
      console.log('beforeRemove:person');

      throw new Error('No way');
    },

    afterRemove() {
      console.log('after:person');
    },

    afterUpdate() {
      console.log('after:update');
    },

    beforeCreate(req) {
      console.log('beforeCreate:person');

      req.item.name = 'Modified Name';
      req.item.secondName = 'An additional Property';
      req.item.loooooongValidation = true;

      return new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      });
    }
  });
};