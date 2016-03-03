'use strict';

const Backendless = require('backendless'),
      ServerCode  = require('./base');

/**
 * @class PersistenceItem
 * @property {Boolean} PersistenceItem#ownerId
 */
class PersistenceItem extends ServerCode {
  constructor() {
    super();

    /**
     Whether this component is visible or not

     @name PersistenceItem#ownerId
     @type Boolean
     */
    this.ownerId = undefined;

    /**
     Item identifier

     @name PersistenceItem#objectId
     @type String
     */
    this.objectId = undefined;

    /**
     When this item was created

     @name PersistenceItem#created
     @type Number
     */
    this.created = undefined;

    /**
     When this item was updated

     @name PersistenceItem#updated
     @type Number
     */
    this.updated = undefined;
  }

  save() {
    return this.dataStore.save(this);
  }

  remove() {
    return this.dataStore.remove(this);
  }

  static get dataStore() {
    return Backendless.Data.of(this.name);
  }

  get dataStore() {
    return Backendless.Data.of(this.__proto__.constructor.name);
  }

  static findFirst() {
    return this.dataStore.findFirst();
  }

  static findLast() {
    return this.dataStore.findLast();
  }

  static findById(id) {
    return this.dataStore.findById(id);
  }
}

module.exports = PersistenceItem;