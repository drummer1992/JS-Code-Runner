'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {*} Business Logic Entity
 */
module.exports = function(backendless) {

  return backendless.serverCode.persistenceEventsHandler('Person', {

    /**
     * @param {Object} request            An object containing an information about event
     * @param {Object} request.context    Application Event context
     * @param {Object} request.objectId   An ID of the object
     * @param {String} request.entityName
     *
     * @param {Object} response
     * @param {Function} response.success
     * @param {Function} response.error
     * @param {String[]} response.result A handling result for a given request. It will be pre-filled if this is an 'after' event
     * Ignored for async events
     */
    beforeLoadRelations(request, response) {
    },

    /**
     * @param {Object}request
     * @param {Backendless.DataQuery} request.query
     *
     * @param {Object} response
     * @param {Function} response.success
     * @param {Function} response.error
     */
    beforeFind(request, response) {
    },

    /**
     * @param {Object}request
     * @param {Backendless.DataQuery} request.query
     *
     * @param {Object} response
     * @param {Function} response.success
     * @param {Function} response.error
     * @param {Array<Object>} response.result
     */
    afterFind(request, response) {

    }
  });

};