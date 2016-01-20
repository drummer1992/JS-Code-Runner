'use strict';

var CodeRunner = require('../../lib');

//noinspection JSUnusedLocalSymbols,Eslint
module.exports = CodeRunner.handler('persistence', 'Order', {
  beforeRemove: function(context, request) {
    console.log('Before Order Remove');
  },

  afterRemove: function(context, request, response) {
    console.log('After Order Remove');
  }
});