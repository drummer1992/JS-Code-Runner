'use strict';

const json   = require('../lib/util/json'),
      should = require('should');

require('mocha');

describe('JSON Util', function() {
  describe('parse', function() {
    it('should resolve object references', function() {
      const parsed = json.parse('[{"role":[""]},{"name":"John","roles":[""]},{"result":{"___objectref":3}}]');

      should.equal(parsed[1], parsed[2].result);
      should.equal(parsed[1].name, 'John');
    });

    it('should resolve circular object references', function() {
      const a = json.parse('{"b":{"a":{"___objectref": 0}},"c":{"___objectref": 1}}');

      should.equal(a, a.b.a);
      should.equal(a.b, a.c);
    });

    it('should perform class mappings', function() {
      class Person {
      }

      json.parse('{"___class":"Person"}', { 'Person': Person }).should.be.instanceof(Person);
    });
  });

  describe('stringify', function() {
    it('should resolve object references', function() {
      const a = {};
      const b = { a };

      const s = json.stringify({ a, b, c: [{ a }, { b }] });
      s.should.equal('{"a":{},"b":{"a":{"___objectref":1}},"c":[{"a":{"___objectref":1}},{"b":{"___objectref":2}}]}');
    });

    it('should resolve circular object references', function() {
      const a = {};
      a.b = a; //circular

      json.stringify(a).should.equal('{"b":{"___objectref":0}}');
    });
  });

  it('should resolve object references after full transform circle', function() {
    const a = {};
    const b = { a };
    const z = { a, '10': {}, '01': a, 1: { 2: b, a: {} }, d: {}, b, c: [{ a }, { b }] };

    const parsed = json.parse(json.stringify(z));

    should.equal(parsed.a, parsed.b.a);
    should.equal(parsed.a, parsed.c[0].a);
    should.equal(parsed.b, parsed.c[1].b);
  });
});