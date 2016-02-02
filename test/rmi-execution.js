'use strict';

const mockery      = require('mockery'),
      should       = require('should'),
      invokeMethod = require('../lib/server-code/runners/tasks/invoke-method');

require('mocha');

function encodeObj(o) {
  const s = JSON.stringify(o);
  const result = [];

  for (var i = 0; i < s.length; ++i) {
    result.push(s.charCodeAt(i));
  }

  return result;
}

function decodeObj(a) {
  return JSON.parse(String.fromCharCode.apply(String, a));
}

describe('RMI execution', function() {
  it('should handle [afterFindById] event', function() {
    const objectId = 1;
    const relations = ['one', 'two'];
    const context = {};

    const task = {
      arguments: encodeObj([context, objectId, relations])
    };

    const model = {};

    return invokeMethod(task, model)
      .then((result) => {
        const args = decodeObj(result);

        args[0].should.be.eql(context);
        args[1].should.be.eql(objectId);
        args[2].should.be.eql(relations);

        result.should.be.eql({exception: 'blabla'});
      });
  });
});