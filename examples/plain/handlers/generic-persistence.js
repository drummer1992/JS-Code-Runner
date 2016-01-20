'use strict';

var Backendless = require('../../backendless');

module.exports = {
  type: 'handler',
  service: 'persistence',
  asset: '*',

  beforeRemove: function(context, request) {
    //request.error && request.success are null because of handler async nature;
    Backendless.debug('Hey. Someone is about to remove something!');
  },

  afterRemoveSync: function(context, request, response) {
    Backendless.debug('Ohh. well.. forget..');
  },

  beforeAdd: function() {
    Backendless.debug('Yummy! Give me some more!');
  }
};