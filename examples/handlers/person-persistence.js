/* global Backendless */

'use strict';

module.exports = Backendless.ServerCode.persistenceEventsHandler('Person', {

  afterCreate(req, res) {
    console.log('afterCreate:person');

    //circular reference should not be a problem
    req.item.innerItem = req.item;
  },

  beforeFind(req) {
    console.log('beforeFind:person');
  },

  afterFind(req, res) {
    console.log('afterFind:person');
  },

  beforeRemove(req) {
    console.log('beforeRemove:person');

    //throw an Error or return a rejected promise to stop further event propagation
    throw new Error('No way');
  },

  afterRemove(req, res) {
    console.log('after:person');
  },

  afterUpdate(req, res) {
    console.log('after:update');
  },

  beforeCreate(req) {
    console.log('beforeCreate:person');

    req.item.name = 'Modified Name';
    req.item.secondName = 'An additional Property';

    return new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });
  }

});