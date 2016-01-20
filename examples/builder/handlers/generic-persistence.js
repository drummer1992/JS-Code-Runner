'use strict';

var CodeRunner = require('../../../lib');
var Backendless = require('../../backendless');
var sync = CodeRunner.handler.sync;

module.exports = CodeRunner.handler('persistence', '*', {
  beforeRemove: function(context, request) {
    //request.error && request.success are null because of handler async nature;
    Backendless.debug('Hey. Someone is about to remove something!');
  },

  afterRemove: function(context, request, response) {
    Backendless.debug('Ohh. well.. forget..');
  },

  beforeAdd: sync(function() {
    Backendless.debug('Yummy! Give me some more!');
  })
});