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
    afterCreate(req, res) {
      console.log('afterCreate');

      //add some new properties to created object
      //res.result.created = new Date().getTime();
      res.sendSuccess({ne: 'yebet'});
    },

    beforeFind(req, res) {
      console.log('beforeFind:generic');

      res.sendSuccess();
    },

    beforeRemove(req, res) {
      console.log('beforeRemove:generic');

      res.error('No way !!'); //stop an operation with an error
    },


    beforeCreate(req, res) {
      console.log('beforeCreate:generic');

//      res.sendError('Ne nada');
//      Modify the item in request
      req.item.name = 'Modified Name';
      req.item.secondName = 'An additional Property';

      //stop further operation proceeding and respond to client with a specific result
      res.sendSuccess();
    }
  });

};