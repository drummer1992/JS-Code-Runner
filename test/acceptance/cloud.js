'use strict';

const serverCode  = require('./server-code'),
      events      = require('../../lib/server-code/events'),
      should      = require('should'),
      PERSISTENCE = events.providers.PERSISTENCE;

require('mocha');

const app = {
  server : 'http://apitest.backendless.com',
  id     : '321AEB7F-3789-7AF8-FFA5-425A7F482200',
  blKey  : 'B742A4A3-7678-3F21-FF53-B8047CED4200',
  restKey: '5E99B304-EB00-9ABA-FF19-180F6B370800',
  version: 'v1'
};

function request(method, path) {
  return require('supertest')(app.server + '/' + app.version)[method](path)
    .set('application-id', app.id)
    .set('secret-key', app.restKey);
}

describe('In CLOUD', function() {
  describe('[before] event handler', function() {
    this.timeout(10000);

    it('should be able to modify request', function(done) {
      function handler(req) {
        req.item.name += ' Bar';
      }

      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, handler)
        .deploy()
        .then(() => {
          request('post', '/data/Person')
            .send({ name: 'Foo' })
            .expect(200, /"name":"Foo Bar"/, done);
        })
        .catch(done);
    });

    it('should be able to replace request', function(done) {
      function handler(req) {
        req.item = { Foo: 'Bar' };
      }

      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, handler)
        .deploy()
        .then(() => {
          request('post', '/data/Person')
            .send({ name: 'Foo' })
            .expect(200, /"Foo":"Bar"/, done);
        })
        .catch(done);
    });

    it('should be able to prevent default behavior by throwing simple Error', function(done) {
      function handler() {
        throw new Error('You shall not pass');
      }

      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, handler)
        .deploy()
        .then(() => {
          request('post', '/data/Person')
            .send({ name: 'Foo' })
            .expect(400, { code: 0, message: 'You shall not pass' }, done);
        })
        .catch(done);
    });

    it('should be able to prevent default behavior by throwing custom Error', function(done) {
      function handler() {
        throw new Backendless.ServerCode.Error(1000, 'You shall not pass');
      }

      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, handler)
        .deploy()
        .then(() => {
          request('post', '/data/Person')
            .send({ name: 'Foo' })
            .expect(400, { code: 1000, message: 'You shall not pass' }, done);
        })
        .catch(done);
    });
  });

  describe('[after] event handler', function() {

  });
});