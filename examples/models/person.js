'use strict';

/**
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 */
module.exports = function(backendless) {

  return class Person extends backendless.serverCode.PersistenceItem {
    constructor(o) {
      super();

      /**
       @name Person#name
       @type String
       */
      this.name = undefined;
    }
  };
};