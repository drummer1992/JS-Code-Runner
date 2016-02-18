'use strict';

const json = require('../lib/util/json'),
      should          = require('should');

require('mocha');

const backendlessJSON = '[{"role":["NotAuthenticatedUser"]},{"___jsonclass":"Person","address":"Mars","___class":"Person","name":"Modified Name","ownerId":null,"updated":null,"objectId":"36D8EED5-6CBF-157C-FFCC-A8B3CFC30300","secondName":"An additional Property","nnn":"ggg","___dates___":["1455703539000"]},{"___jsonclass":"com.backendless.servercode.ExecutionResult","exception":null,"result":{"___objectref":3.0}}]';

describe('JSON Util', function() {
  describe('parse', function() {
    it('should resolve object references', function() {
      const parsed = json.parse(backendlessJSON);

      should.equal(parsed[1], parsed[2].result);
    });

    it('should resolve circular object references', function() {
      const a = json.parse('{"b":{"a":{"___objectref": 0}},"c":{"___objectref": 1}}');

      should.equal(a, a.b.a);
      should.equal(a.b, a.c);
    });

    it('should perform class mappings', function() {
      class Person {}

      const parsed = json.parse(backendlessJSON, {'Person': Person});

      parsed[1].should.be.instanceof(Person);
    });
  });

  describe('stringify', function() {
    it('should resolve object references', function() {
      const a = {};
      const b = {a};

      const stringified = json.stringify({a, b, c: [{a}, {b}]});
      stringified.should.equal('{"a":{},"b":{"a":{"___objectref":1}},"c":[{"a":{"___objectref":1}},{"b":{"___objectref":2}}]}');
    });

    it('should resolve circular object references', function() {
      const a = {};
      a.b = a; //circular

      const stringified = json.stringify(a);
      stringified.should.equal('{"b":{"___objectref":0}}');
    });
  });

  it('should resolve object references after full transform circle', function() {
    const a = {};
    const b = {a};

    const stringified = json.stringify({a, '10': {}, '01': a, 1:{2: b, a:{}}, z:{}, b, c: [{a}, {b}]});
    const parsed = json.parse(stringified);

    should.equal(parsed.a, parsed.b.a);
    should.equal(parsed.a, parsed.c[0].a);
    should.equal(parsed.b, parsed.c[1].b);
  })
});