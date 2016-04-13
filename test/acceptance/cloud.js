'use strict';

const app = {
  server : 'http://apitest.backendless.com',
  id     : '321AEB7F-3789-7AF8-FFA5-425A7F482200',
  blKey  : 'B742A4A3-7678-3F21-FF53-B8047CED4200',
  restKey: '5E99B304-EB00-9ABA-FF19-180F6B370800',
  version: 'v1'
};

const promise     = require('../../lib/util/promise'),
      assert      = require('assert'),
      Backendless = require('backendless'),
      serverCode  = require('../support/server-code'),
      request     = require('../support/request')(app),
      events      = require('../../lib/server-code/events'),
      logger      = require('../../lib/util/logger'),
      PERSISTENCE = events.providers.PERSISTENCE;

require('mocha');

Backendless.serverURL = app.server;
Backendless.enablePromises();
Backendless.initApp(app.id, app.restKey, app.version);

function cleanTable(tableName) {
  const dataStore = Backendless.Persistence.of(tableName);
  const restUrl = dataStore.restUrl;

  dataStore.restUrl = `${Backendless.appPath}/data/bulk/${dataStore.className}?where=created>0`;

  return dataStore.remove({ toJSON: () => '' })
    .then(() => dataStore.restUrl = restUrl);
}

describe('In CLOUD', function() {
  this.timeout(10000);

  before(function() {
    return serverCode(app).clean();
  });

  describe('[before] event handler', function() {
    it('should be able to modify request', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, (req) => {
          req.item.name += ' Bar';
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(200, /"name":"Foo Bar"/, done);
        }, done);
    });

    it('should be able to replace request', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, (req) => {
          req.item = { Foo: 'Bar' };
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(200, /"Foo":"Bar"/, done);
        }, done);
    });

    it('should be able to prevent [default] and [after] behaviours by returning specific result', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, () => {
          return { foo: 'bar' };
        })
        .addHandler(PERSISTENCE.events.afterCreate, () => {
          throw 'Should not be called';
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(200, { foo: 'bar' }, done);
        }, done);
    });

    it('should be able to prevent default behavior by throwing simple Error', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, () => {
          throw 'You shall not pass';
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(400, { code: 0, message: 'You shall not pass' }, done);
        }, done);
    });

    it('should be able to prevent default behavior by throwing custom Error', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, (res) => {
          throw new Backendless.ServerCode.Error(1000, 'You shall not pass');
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(400, { code: 1000, message: 'You shall not pass' }, done);
        })
        .catch(done);
    });
  });

  describe('[after] event handler', function() {
    it('should be able to modify server response', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, (res) => {
          res.item.name += ' Bar';
        })
        .addHandler(PERSISTENCE.events.afterCreate, (req, res) => {
          res.result.name += ' Baz';
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(200, /"name":"Foo Bar Baz"/, done);
        }, done);
    });

    it('should be able replace server response', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.afterCreate, () => {
          return { replaced: true };
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(200, { replaced: true }, done);
        }, done);
    });

    it('should be able to throw e rror', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.afterCreate, () => {
          throw new Backendless.ServerCode.Error(1000, 'You shall not pass');
        })
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(400, { code: 1000, message: 'You shall not pass' }, done);
        })
        .catch(done);
    });
  });

  describe('custom events', function() {
    it('should be able to return complex object', function(done) {
      serverCode(app)
        .addCustomEvent('readdir', () => ({ foo: 'bar' }))
        .deploy()
        .then(() => {
          request('post', '/servercode/events/readdir')
            .expect(200, { foo: 'bar' }, done);
        })
        .catch(done);
    });

    it('should be able to return primitive', function(done) {
      serverCode(app)
        .addCustomEvent('readdir', () => 'test')
        .deploy()
        .then(() => {
          request('post', '/servercode/events/readdir')
            .expect(200, 'test', done);
        })
        .catch(done);
    });
  });

  describe('security', function() {
    it('should allow user to access app folder', function(done) {
      function handler() {
        return { items: require('fs').readdirSync(process.env.HOME) };
      }

      logger.verbose = true;

      serverCode(app)
        .addCustomEvent('readHomeDir', handler)
        .deploy()
        .then(() => {
          request('post', '/servercode/events/readHomeDir')
            .expect(200, { items: ['files'] }, done);
        })
        .catch(done);
    });

    it('should forbid access to fs outside of user/app home folder', function(done) {
      function handler() {
        const fs = require('fs'), path = require('path');

        return {
          items: fs.readdirSync(path.resolve(process.env.HOME, '..'))
          //, ff   : fs.readdirSync(path.resolve(process.env.HOME, '..', '00dfa30d-e8b2-1389-fff2-03b958eff300'))
        };
      }

      serverCode(app)
        .addCustomEvent('readOther', handler)
        .deploy()
        .then(() => {
          request('post', '/servercode/events/readOther')
            .expect(400, /"message":"EACCES: permission denied/, done);
        })
        .catch(done);
    });

    describe('external hosts', function() {
      before(function() {
        function handler(req) {
          return new Promise((resolve, reject) => {
            require('http').get(req.args.url, (res) => {
              let body = '';

              res.on('data', (chunk) => body += chunk);
              res.on('end', () => {
                resolve({ body });
              });

              res.resume();
            }).on('error', reject);
          });
        }

        return serverCode(app)
          .addCustomEvent('testExternal', handler)
          .deploy();
      });

      it('should forbid access to registered external host', function(done) {
        request('post', '/servercode/events/testExternal', { url: app.server })
          .expect(200, /All works!/, done);
      });

      it('should allow access to registered external host', function(done) {
        request('post', '/servercode/events/testExternal', { url: 'http://google.com' })
          .expect(400, /ECONNREFUSED/, done);
      });
    });
  });

  describe('task timeout', function() {
    it('should be respected in custom event handler', function(done) {
      serverCode(app)
        .addCustomEvent('testTimeout', () => new Promise(() => {}))
        .deploy()
        .then(() => {
          request('post', '/servercode/events/testTimeout')
            .expect(400, { code: 0, message: '' }, done);
        })
        .catch(done);
    });

    it('should be respected in persistence', function(done) {
      serverCode(app)
        .addHandler(PERSISTENCE.events.beforeCreate, () => new Promise(() => {}))
        .deploy()
        .then(() => {
          request('post', '/data/Person', { name: 'Foo' })
            .expect(400, { code: 1000, message: 'You shall not pass' }, done);
        })
        .catch(done);
    });
  });

  describe('timer', function() {
    before(function() {
      return Backendless.Persistence.of('TestTimer').save({});
    });

    beforeEach(function() {
      return cleanTable('TestTimer');
    });

    it('should tick', function() {
      this.timeout(200000);

      function timerTick() {
        Backendless.enablePromises();

        return Backendless.Persistence.of('TestTimer').save({ tick: new Date().getTime() });
      }

      const timer = {
        name: 'test',

        frequency: {
          schedule: 'custom',
          repeat  : { every: 60 }
        },

        execute: timerTick
      };

      return serverCode(app)
        .addTimer(timer)
        .deploy()
        .then(() => promise.wait(130000)) //wait for 2 ticks + pad
        .then(() => Backendless.Persistence.of('TestTimer').find())
        .then(result => assert.equal(result.data.length, 2));
    });
  });
});