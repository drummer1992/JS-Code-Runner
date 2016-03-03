'use strict';

/**
 * @function
 *
 * @param {Object} Backendless
 * @param {Object} Backendless.api        - Backendless Client API pre-initialized by the context application
 * @param {Object} Backendless.ServerCode - Business Logic API for creating EventsHandlers, Timers and Services
 *
 * @returns {Person} Server Code logic
 */
module.exports = function(Backendless) {

  /**
   * @class Person
   * @extends PersistenceItem
   * @property {String} name
   */
  return class Person extends Backendless.ServerCode.PersistenceItem {
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