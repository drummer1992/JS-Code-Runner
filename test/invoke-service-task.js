'use strict';

const ServerCode      = require('../lib/server-code/api'),
      ServerCodeModel = require('../lib/server-code/model'),
      assert          = require('assert'),
      executor        = require('../lib/server-code/runners/tasks/executor'),
      executionResult = require('../lib/server-code/runners/tasks/util/result-wrapper').executionResult,
      argsUtil        = require('../lib/server-code/runners/tasks/util/args');

require('mocha');

function createTask(service, method, args, configItems) {
  return {
    ___jsonclass        : executor.RSI,
    initAppData         : {},
    serviceId           : service.name,
    className           : service.name,
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
    .then(res => res && JSON.parse(res));
}

function modelStub(service) {
  const result = new ServerCodeModel();
  result.definitions.addFile = () => {
  };
  result.addService(service);

  return result;
}

describe('[invoke-service] task executor', function() {
  it('should invoke service method', function() {
    let invoked = false;

    class Foo {
      bar() {
        invoked = true;
      }
    }

    return invoke(createTask(Foo, 'bar'), modelStub(Foo))
      .then(() => assert.ok(invoked));
  });

  it('should pass arguments to service method', function() {
    let invoked = false;

    class Foo {
      bar(a, b, c) {
        assert.equal(a, 1);
        assert.equal(b, 2);
        assert.deepEqual(c, {});

        invoked = true;
      }
    }

    return invoke(createTask(Foo, 'bar', [1, 2, {}]), modelStub(Foo))
      .then(() => assert.ok(invoked));
  });

});