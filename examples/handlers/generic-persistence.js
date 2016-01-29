'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {*} Business Logic Entity
 */
module.exports = function(backendless) {

  return backendless.serverCode.persistenceEventsHandler('*', {
    afterCreate(context, request) {
      backendless.api.debug('After create');
    },

    beforeRemove(context, request) {
      backendless.api.debug('Hey. Someone is about to remove something!');
    },

    afterRemove(context, request, response) {
      backendless.api.debug('Ohh. well.. forget..');
    },

    beforeCreateSync(context, request) {
      backendless.api.debug('Before create. Synchronized');
    }
  });

};