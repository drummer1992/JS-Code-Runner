'use strict';

const Backendless = require('backendless');

class PersistenceItem {
  constructor(args) {
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

    Object.assign(this, args);
  }

  /**
   * @param {String[]} [relations]
   * @param {String[]} [properties]
   * @returns {Promise.<PersistenceItem>}
   */
  fetch(relations, properties) {
    return this.constructor.findById(this.objectId, relations, properties);
  }

  /**
   * @returns {Promise}
   */
  save() {
    return this.dataStore.save(this);
  }

  /**
   * @returns {Promise}
   */
  remove() {
    return this.dataStore.remove(this);
  }

  /**
   * @param {String} columnName - A name of the column identifying the relation
   * @param {Array|String} childrenOrWhereClause
   * @returns {Promise}
   */
  setRelation(columnName, childrenOrWhereClause) {
    return this.dataStore.setRelation(this, columnName, childrenOrWhereClause);
  }

  /**
   * @param {String} columnName - A name of the column identifying the relation
   * @param {Array|String} childrenOrWhereClause
   * @returns {Promise}
   */
  addRelation(columnName, childrenOrWhereClause) {
    return this.dataStore.addRelation(this, columnName, childrenOrWhereClause);
  }

  /**
   * @private
   */
  get dataStore() {
    return Backendless.Persistence.of(this.constructor);
  }

  /**
   * @private
   */
  static get dataStore() {
    return Backendless.Persistence.of(this);
  }

  /**
   * @param {Backendless.DataQuery} dataQuery
   * @returns {Promise}
   */
  static count(dataQuery) {
    return this.dataStore.getObjectCount(dataQuery);
  }

  /**
   * @param {Object} obj
   * @returns {Promise.<PersistenceItem>}
   */
  static save(obj) {
    return new this(obj).save();
  }

  /**
   * @param {Backendless.DataQuery} dataQuery
   * @returns {Promise.<PersistenceItem[]>}
   */
  static find(dataQuery) {
    return this.dataStore.find(dataQuery);
  }

  /**
   * @param {String} objectId
   * @param {String[]} [relations]
   * @param {String[]} [properties]
   * @returns {Promise.<PersistenceItem>}
   */
  static findById(objectId, relations, properties) {
    if (!objectId) {
      return Promise.reject(new Error('objectId is not defined'));
    }

    return this.dataStore.findById(objectId, {
      options: { relations },
      properties
    });
  }

  /**
   * @returns {Promise}
   */
  static findFirst() {
    return this.dataStore.findFirst();
  }

  /**
   * @returns {Promise}
   */
  static findLast() {
    return this.dataStore.findLast();
  }

  /**
   * @param {Object|String} obj An object or objectId for deletion
   * @returns {Promise}
   */
  static remove(obj) {
    return this.dataStore.remove(obj);
  }

  /**
   * @param {Object} changes
   * @param {String} whereClause
   * @returns {Promise}
   */
  static bulkUpdate(changes, whereClause) {
    return this.dataStore.bulkUpdate(changes, whereClause);
  }

  /**
   * @param {String|Array<Object|String>} whereClause whereClause or an array of objects/objectIds for deletion
   * @returns {Promise}
   */
  static bulkDelete(whereClause) {
    return this.dataStore.bulkDelete(whereClause);
  }
}

module.exports = PersistenceItem;