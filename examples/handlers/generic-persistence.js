'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {*} Business Logic Entity
 */
module.exports = function(backendless) {

  const apiLogger = backendless.api.Logging.getLogger('server-code');

  return backendless.serverCode.persistenceEventsHandler('*', {
    afterCreate(context, request) {
      apiLogger.debug('After create');
    },

    beforeRemove(context, request) {
      apiLogger.debug('Hey. Someone is about to remove something!');
    },

    afterRemove(context, request, response) {
      apiLogger.debug('Ohh. well.. forget..');
    },

    beforeCreateSync(context, request) {
      apiLogger.debug('Before create. Synchronized');
    }
  });

};