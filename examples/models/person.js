'use strict';

/**
 * @function
 *
 * @param {Object} backendless
 * @param {Object} backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} backendless.serverCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {Person} Server Code logic
 */
module.exports = function(backendless) {

  /**
   * @extends PersistenceItem
   */
  return class Person extends backendless.serverCode.PersistenceItem {
    constructor() {
      super();

      /**
       @name Person#name
       @type String
       */
      this.name = undefined;
    }
  };
};