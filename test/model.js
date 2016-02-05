'use strict';

const ServerCodeModel = require('../lib/server-code/model'),
      should          = require('should');

require('mocha');

describe('ServerCodeModel', function() {
  describe('event handler invocation', function() {
    describe('should throw error when', function() {
      it('unknown eventId');

      it('due to missed handler module');

      it('no handlers for an event');

      it('invalid handler module path');
    });

    it('should differentiate events handlers by target');
  });
});