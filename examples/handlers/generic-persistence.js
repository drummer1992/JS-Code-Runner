'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 */
module.exports = function(backendless) {

  return backendless.serverCode.persistenceEventsHandler('*', {
    afterCreate(req, res) {
      console.log('afterCreate');

      //stop further operation proceeding and respond to client with a specific result
      return {ne: 'yebet'};
    },

    beforeFind(req) {
      console.log('beforeFind:generic');
    },

    beforeRemove(req) {
      console.log('beforeRemove:generic');

      throw new Error('No way !!'); //stop an operation with an error
    },

    beforeCreate(req) {
      console.log('beforeCreate:generic');

//      Modify the item in request
      req.item.name = 'Modified Name';
      req.item.secondName = 'An additional Property';
    }
  });

};