'use strict';

const Backendless = require('backendless');

function promisify(fn, context) {
  return function() {
    return new Promise((resolve, reject) => {
      const args = Array.prototype.slice.call(arguments);
      args.push(new Backendless.Async(resolve, reject));

      fn.apply(context, args);
    });
  };
}

class PersistenceItem {
  constructor() {
    this.___class = this.constructor.name;

    /**
     @type String
     */
    this.ownerId = undefined;

    /**
     @type String
     */
    this.objectId = undefined;

    /**
     @type Number
     */
    this.created = undefined;

    /**
     @type Number
     */
    this.updated = undefined;
  }

  /**
   * @returns {Promise}
   */
  save() {
    return promisify(this.dataStore.save, this.dataStore)(this);
  }

  /**
   * @returns {Promise}
   */
  remove() {
    return promisify(this.dataStore.remove, this.dataStore)(this);
  }

  /**
   * @param {String[]=} options A list of relations to retrieve
   * @returns {Promise}
   */
  loadRelations(options) {
    return promisify(this.dataStore.remove, this.dataStore)(this, options);
  }

  /**
   * @private
   */
  get dataStore() {
    return Backendless.Data.of(this.___class);
  }

  /**
   * @private
   */
  static get dataStore() {
    return Backendless.Data.of(this.name);
  }

  /**
   * @param {Backendless.DataQuery} dataQuery
   * @returns {Promise}
   */
  static find(dataQuery) {
    return promisify(this.dataStore.find, this.dataStore)(dataQuery);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  static findById(id) {
    return promisify(this.dataStore.findById, this.dataStore)(id);
  }

  /**
   * @returns {Promise}
   */
  static findFirst() {
    return promisify(this.dataStore.findFirst, this.dataStore)();
  }

  /**
   * @returns {Promise}
   */
  static findLast() {
    return promisify(this.dataStore.findLast, this.dataStore)();
  }

  /**
   * @param {Object|String} obj An object or objectId for deletion
   * @returns {Promise}
   */
  static remove(obj) {
    return promisify(this.dataStore.remove, this.dataStore)(obj);
  }
}

module.exports = PersistenceItem;