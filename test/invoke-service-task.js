'use strict';

const assert    = require('assert'),
      TestModel = require('./support/test-model'),
      executor  = require('../lib/server-code/runners/tasks/executor'),
      argsUtil  = require('../lib/server-code/runners/tasks/util/args');

require('mocha');

function createTask(service, method, args, configItems) {
  return {
    ___jsonclass        : executor.RSI,
    initAppData         : {},
    serviceId           : service,
    className           : service,
    method              : method,
    applicationId       : '',
    relativePath        : '',
    invocationContextDto: {
      configurationItems: configItems || []
    },
    arguments           : argsUtil.encode(args || [])
  };
}

function invoke(task, model) {
  return executor.execute(task, { backendless: { repoPath: '' } }, model)
    .then(res => JSON.parse(res))
    .then(res => res[0]);
}

describe('[invoke-service] task executor', function() {
  it('should invoke service method', function() {
    let invoked = false;

    class Service {
      test() {
        invoked = true;
      }
    }

    return invoke(createTask(Service.name, 'test'), new TestModel().addService(Service))
      .then(res => assert.equal(res, null))
      .then(() => assert.ok(invoked));
  });

  it('should pass arguments to service method', function() {
    let invoked = false;

    class Service {
      test(a, b, c) {
        assert.equal(a, 1);
        assert.equal(b, 2);
        assert.deepEqual(c, {});

        invoked = true;
      }
    }

    return invoke(createTask(Service.name, 'test', [1, 2, {}]), new TestModel().addService(Service))
      .then(res => {
        assert.equal(res, null);
        assert(invoked);
      });
  });

  describe('should handle error', function() {
    it('when service not found', function() {
      return invoke(createTask('Test', 'test'), new TestModel())
        .then(res => assert.equal(res.exceptionMessage, '[Test] service does not exist'));
    });

    it('when service method not found', function() {
      class Test {
      }

      return invoke(createTask('Test', 'test'), new TestModel().addService(Test))
        .then(res => assert.equal(res.exceptionMessage,
          '[test] method does not exist in [Test] service or is not a function'));
    });

    it('when service method throws an error', function() {
      class Test {
        test() {
          throw new Error('Oops');
        }
      }

      return invoke(createTask('Test', 'test'), new TestModel().addService(Test))
        .then(res => assert.equal(res.exceptionMessage, 'Oops'));
    });

    it('when service method rejects promise', function() {
      class Test {
        test() {
          return Promise.reject('Oops');
        }
      }

      return invoke(createTask('Test', 'test'), new TestModel().addService(Test))
        .then(res => assert.equal(res.exceptionMessage, 'Oops'));
    });

    it('when service method produces async error behind promise', function() {
      class Test {
        test() {
          return new Promise(() => {
            process.nextTick(() => {
              throw new Error('Oops');
            });
          });
        }
      }

      return invoke(createTask('Test', 'test'), new TestModel().addService(Test))
        .then(res => assert.equal(res.exceptionMessage, 'Oops'));
    });
  });

  it('should transform arguments if custom types are defined', function() {
    let invoked = false;

    class Foo {
    }
    class Bar {
      constructor() {
        this.baz = {};
      }
    }

    class Baz {
    }

    class Service {
      test(foo, bar, baz) {
        assert(foo instanceof Foo, 'Invalid type casting');
        assert(bar instanceof Bar, 'Invalid type casting');
        assert(bar.baz instanceof Baz, 'Invalid deep type casting');
        assert(baz[0] instanceof Baz, 'Invalid array elements type casting');
        assert(baz[1] instanceof Baz, 'Invalid array elements type casting');

        invoked = true;
      }
    }

    const model = new TestModel()
      .addService(Service, {
        methods: {
          test: {
            params: [
              { name: 'foo', type: { name: 'Foo' } },
              { name: 'boo', type: { name: 'Bar' } },
              { name: 'baz', type: { name: 'Array', elementType: { name: 'Baz' } } }
            ]
          }
        }
      })
      .addType(Foo)
      .addType(Bar, { properties: { baz: { type: { name: 'Baz' } } } })
      .addType(Baz);

    return invoke(createTask(Service, 'test', [new Foo(), new Bar(), [new Baz(), new Baz()]]), model)
      .then((res) => {
        assert.equal(res, null);
        assert(invoked);
      });
  });

});