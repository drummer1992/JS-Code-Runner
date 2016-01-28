'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {*} Business Logic Entity
 */
module.exports = function(backendless) {

  return backendless.serverCode.persistanceEventsHandler('*', {
    beforeRemove(context, request) {
      backendless.api.data('Hey. Someone is about to remove something!');
    },

    afterRemove(context, request, response) {
      backendless.api.debug('Ohh. well.. forget..');
    },

    beforeAddSync(context, request) {
      backendless.api.debug('');
    }
  });

};