'use strict';

/**
 * @param {Object} Backendless
 * @param {Object} Backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} Backendless.ServerCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {Object} Server Coder Module
 */
module.exports = function(Backendless) {

  //noinspection JSUnusedLocalSymbols,Eslint
  return Backendless.ServerCode.persistenceEventsHandler('*', {
    /**
     * @param {Object} request
     * @param {Object} response
     * @returns {Object|Promise.<Object>|void}
     */
    afterCreate(request, response) {
      console.log('afterCreate');

      //stop further operation proceeding and respond to client with a specific result
      return {ne: 'yebet'};
    },

    /**
     * @param {Object} request
     * @returns {Object|Promise.<Object>|void}
     */
    beforeFind(request) {
      console.log('beforeFind:generic');
    },

    /**
     * @param {Object} request
     * @returns {Object|Promise.<Object>|void}
     */
    beforeRemove(request) {
      console.log('beforeRemove:generic');

      throw new Error('No way !!'); //stop an operation with an error
    },

    /**
     * @param {Object} request
     * @returns {Object|Promise.<Object>|void}
     */
    beforeCreate(request) {
      console.log('beforeCreate:generic');

//      Modify the item in request
      request.item.name = 'Modified Name';
      request.item.secondName = 'An additional Property';
    }
  });

};