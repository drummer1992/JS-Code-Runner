/* global Backendless  */

'use strict';

module.exports = Backendless.ServerCode.persistenceEventsHandler('*', {

  afterCreate(req, res) {
    console.log('afterCreate');

    //stop further operation proceeding and respond to the client with a specific result
    return { foo: 'bar' };
  },

  beforeFind(req) {
    console.log('beforeFind:generic');
  },

  beforeRemove(req) {
    console.log('beforeRemove:generic');

    throw new Error('No way !!'); //stop an operation with an error
  },

  beforeCreate(req) {
    console.log('beforeCreate:generic');

    // Modify an item in the request
    req.item.name = 'Modified Name';
    req.item.secondName = 'An additional Property';
  }

});