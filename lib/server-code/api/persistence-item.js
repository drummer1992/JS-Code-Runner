'use strict';

const Backendless = require('backendless');

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

  fetch(relations, properties) {
    if (!this.objectId) {
      return Promise.reject(new Error('objectId is not defined'))
    }

    const query = Backendless.DataQueryBuilder.create();

    relations && query.setRelated(relations);
    properties && query.setProperties(properties);
    query.setWhereClause(`objectId = '${this.objectId}'`);

    return this.dataStore.find(query).then(result => result[0])
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
  static find(dataQuery) {
    return this.dataStore.find(dataQuery);
  }

  /**
   * @param {String} id
   * @returns {Promise}
   */
  static findById(id) {
    return this.dataStore.findById(id);
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
   * @param {String\Array<Object|String>} whereClause whereClause or an array of objects/objectIds for deletion
   * @returns {Promise}
   */
  static bulkRemove(whereClause) {
    return this.dataStore.bulkDelete(whereClause);
  }
}

module.exports = PersistenceItem;