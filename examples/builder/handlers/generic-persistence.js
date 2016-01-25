'use strict';

var CodeRunner = require('backendless-coderunner');
var Backendless = require('../../backendless');

module.exports = CodeRunner.persistenceEventsHandler('*', {
  beforeRemove(context, request) {
    //request.error && request.success are null because of handler async nature;
    Backendless.debug('Hey. Someone is about to remove something!');
  },

  afterRemove(context, request, response) {
    Backendless.debug('Ohh. well.. forget..');
  },

  beforeAddSync(context, request) {
    Backendless.debug('');
  }
});