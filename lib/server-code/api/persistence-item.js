'use strict';

const Backendless = require('backendless');

const isPersistable = value =>
  value instanceof PersistenceItem ||
  value instanceof Backendless.GeoPoint;

const isArrayOfPersistable = value => {
  if (!Array.isArray(value) || value.length === 0) {
    return false;
  }

  for (let i = 0; i < value.length; i++) {
    if (!isPersistable(value[i])) {
      return false;
    }
  }

  return true;
};

const trimRelations = item => {
  const result = {};

  Object.keys(item).forEach(key => {
    const value = item[key];

    if (!isPersistable(value) && !isArrayOfPersistable(value)) {
      result[key] = value;
    }
  });

  return result;
};

const SYSTEM_PROPS = ['objectId', 'ownerId', 'objectId', 'created', 'updated', '___class', '___jsonclass'];

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
    const payload = trimRelations(this);

    const hasCustomProps = !!Object.keys(payload).find(key =>
      payload[key] !== undefined && !SYSTEM_PROPS.includes(key));

    if (!payload.objectId || hasCustomProps) {
      return this.dataStore.save(payload).then(saved => Object.assign(this, saved));
    }

    return Promise.resolve(this);
  }

  /**
   * @param {{stale: String[]}} [options]
   * @returns {Promise.<PersistenceItem>}
   */
  saveWithRelations(options = {}) {
    const { stale = [] } = options;

    const staleForChild = key => {
      const prefix = `${key}.`;

      stale.filter(s => s.startsWith(prefix)).map(s => s.substr(prefix.length));
    };

    return this.save().then(saved => {

      const saveItem = item => {
        if (item instanceof PersistenceItem) {
          return item.saveWithRelations();
        }

        if (item instanceof Backendless.GeoPoint) {
          return Backendless.Geo.savePoint(item);
        }

        return item;
      };

      const processField = (name, value) => {
        const setRelation = relation => {
          saved[name] = relation;

          return saved.setRelation(name, relation);
        };

        if (isPersistable(value)) {
          return Promise.resolve()
            .then(() => stale.includes(name) ? value : saveItem(value, staleForChild(name)))
            .then(setRelation);
        }

        if (isArrayOfPersistable(value)) {
          return Promise.resolve()
            .then(() => stale.includes(name) ? value : Promise.all(value.map(item => saveItem(item, staleForChild(name))))) // eslint-disable-line
            .then(setRelation);
        }
      };

      return Promise.all(Object.keys(this).map(key => processField(key, this[key])))
        .then(() => saved);
    });
  }

  /**
   * @returns {Promise}
   */
  remove() {
    return this.dataStore.remove(this);
  }

  /**
   * @param {String} columnName - A name of the column identifying the relation
   * @param {PersistenceItem|PersistenceItem[]|String} childrenOrWhereClause
   * @returns {Promise}
   */
  setRelation(columnName, childrenOrWhereClause) {
    if (isPersistable(childrenOrWhereClause)) {
      childrenOrWhereClause = [childrenOrWhereClause];
    }

    return this.dataStore.setRelation(this, columnName, childrenOrWhereClause);
  }

  /**
   * @param {String} columnName - A name of the column identifying the relation
   * @param {PersistenceItem|PersistenceItem[]|String} childrenOrWhereClause
   * @returns {Promise}
   */
  addRelation(columnName, childrenOrWhereClause) {
    if (isPersistable(childrenOrWhereClause)) {
      childrenOrWhereClause = [childrenOrWhereClause];
    }

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
   * @param {String} condition
   * @returns {Promise}
   */
  static count(condition) {
    return this.dataStore.getObjectCount(condition);
  }

  /**
   * @param {Object} obj
   * @returns {Promise.<PersistenceItem>}
   */
  static save(obj) {
    return new this(obj).save();
  }

  /**
   * @param {Object} obj
   * @param {Object} [opts]
   * @returns {Promise.<PersistenceItem>}
   */
  static saveWithRelations(obj, opts) {
    return new this(obj).saveWithRelations(opts);
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