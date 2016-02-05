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
     * @param {Object}req
     * @param {Object} req.query
     *
     * @param {Object} res
     * @param {Function} res.success
     * @param {Function} res.error
     */
    beforeFind(req, res) {
      console.log('beforeFind:person');
      res.success();
    },

    /**
     * @param {Object}req
     * @param {Object} req.query
     *
     * @param {Object} res
     * @param {Function} res.success
     * @param {Function} res.error
     * @param {Array<Object>} res.result
     */
    afterFind(req, res) {
      console.log('afterFind:person');
      res.success();
    }
  });

};