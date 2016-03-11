'use strict';

const Backendless = require('backendless');

function promisify(fn, context) {
    return function () {
        return new Promise((resolve, reject)=> {
            var args = Array.prototype.slice.call(arguments);
            args.push(new Backendless.Async(resolve, reject));

            fn.apply(context, args);
        });
    }
}

class PersistenceItem {
    constructor() {
        /**
         @name PersistenceItem#ownerId
         @type String
         */
        this.ownerId = undefined;

        /**
         @name PersistenceItem#objectId
         @type String
         */
        this.objectId = undefined;

        /**
         @name PersistenceItem#created
         @type Number
         */
        this.created = undefined;

        /**
         @name PersistenceItem#updated
         @type Number
         */
        this.updated = undefined;
    }

    save() {
        return promisify(this.dataStore.save, this.dataStore)(this);
    }

    remove() {
        return promisify(this.dataStore.remove, this.dataStore)(this);
    }

    static get dataStore() {
        return Backendless.Data.of(this.name);
    }

    get dataStore() {
        return Backendless.Data.of(this.__proto__.constructor.name);
    }

    static findFirst() {
        return promisify(this.dataStore.findFirst, this.dataStore)();
    }

    static findLast() {
        return promisify(this.dataStore.findLast, this.dataStore)();
    }

    static findById(id) {
        return promisify(this.dataStore.findById, this.dataStore)(id);
    }
}

module.exports = PersistenceItem;