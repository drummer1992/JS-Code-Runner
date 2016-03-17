'use strict';

const should        = require('should'),
      events        = require('../lib/server-code/events'),
      json          = require('../lib/util/json'),
      executor      = require('../lib/server-code/runners/tasks/executor'),
      resultWrapper = require('../lib/server-code/runners/tasks/util/result-wrapper'),
      PERSISTENCE   = events.providers.PERSISTENCE,
      BEFORE_CREATE = PERSISTENCE.events.beforeCreate,
      AFTER_CREATE  = PERSISTENCE.events.afterCreate;

require('mocha');

function stringToBytes(s) {
  return s.split('').map((c, i) => s.charCodeAt(i));
}

function encodeArgs(args) {
  return (args && args.length && stringToBytes(json.stringify(args))) || [];
}

function decodeArgs(args) {
  return (args && args.length && json.parse(String.fromCharCode.apply(String, args))) || [];
}

function modelStub(handlerFn, classMappings) {
  return {
    getHandler   : () => ({ invoke: handlerFn }),
    classMappings: classMappings
  };
}

function createTask(event, args, async) {
  return {
    ___jsonclass: executor.RMI,
    eventId     : event.id,
    async       : !!async,
    initAppData : {},
    arguments   : encodeArgs(args || [])
  };
}

function invokeAndParse(task, model) {
  return executor.execute(task, {}, model)
    .then(res => res && json.parse(res))
    .then(res => {
      if (res && res.arguments) {
        res.arguments = res.arguments && decodeArgs(res.arguments);
      }
      return res;
    });
}

describe('[invoke-handler] task executor', function() {
  it('should fill [request] params', function() {
    const task = createTask(BEFORE_CREATE, [{}, { name: 'John' }]);

    function handler(req) {
      should.exist(req.item);
      req.item.should.be.eql({ name: 'John' });
    }

    return invokeAndParse(task, modelStub(handler)).should.be.fulfilled();
  });

  describe('should perform class mapping', function() {
    it('for persistence items', function() {
      class Foo {
      }
      class Bar {
      }
      class Baz {
      }

      let handlerInvoked;

      function handler(req, res) {
        handlerInvoked = true;

        req.item.should.be.instanceof(Foo);
        should.equal(req.item.a, 'a');

        req.item.bar.should.be.instanceof(Bar);
        should.equal(req.item.bar.b, 'b');

        res.result[0].should.be.instanceof(Baz);
        res.result[1].should.be.instanceof(Baz);
      }

      const item = { a: 'a', bar: { ___class: 'Bar', b: 'b' }, ___class: 'Foo' };
      const result = resultWrapper.executionResult(null, [{ ___class: 'Baz' }, { ___class: 'Baz' }]);

      return invokeAndParse(createTask(AFTER_CREATE, [{}, item, result]), modelStub(handler, {
        Foo,
        Bar,
        Baz
      }))
        .then((res) => {
          should.equal(handlerInvoked, true);

          should.not.exists(res.exception);

          should.equal(res.arguments[1].___class, 'Foo');
          should.equal(res.arguments[1].bar.___class, 'Bar');
          should.equal(res.arguments[2].result[0].___class, 'Baz');
          should.equal(res.arguments[2].result[1].___class, 'Baz');
        });
    });
  });

  describe('should handle', function() {
    it('unsupported event error', function() {
      return invokeAndParse(createTask({ id: -1 }), { handlers: [] }).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.startWith('Integrity violation');
      });
    });

    it('errors raised in the event handler', function() {
      function handler() {
        throw new Error('Error');
      }

      return invokeAndParse(createTask(BEFORE_CREATE), modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Error');
      });
    });

    it('async errors raised in the event handler behind the promise', function() {
      function handler() {
        process.nextTick(() => {
          throw new Error('Async Error');
        }, 0);

        return new Promise(() => {
        }); //never resolved promise
      }

      return invokeAndParse(createTask(BEFORE_CREATE), modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Async Error');
      });
    });

    it('handler execution timeout', function() {
      const task = createTask(BEFORE_CREATE);
      task.timeout = 1;

      function handler() {
        return new Promise((resolve) => {
          setTimeout(() => resolve('buba'), 20);
        });
      }

      return invokeAndParse(task, modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Task execution aborted due to timeout');
      });
    });

    it('errors thrown from handler', function() {
      function handler() {
        throw new Error('Error in Handler!');
      }

      return invokeAndParse(createTask(BEFORE_CREATE), modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.be.eql('Error in Handler!');
      });
    });
  });

  describe('in [before] event phase', function() {
    it('should allow input parameters modifying', function() {
      const task = createTask(BEFORE_CREATE, [{}, { name: 'John' }]);

      function handler(req) {
        req.item = { name: 'Dou' };
      }

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[1].should.be.eql({ name: 'Dou' });
      });
    });

    it('should allow short circuit feature (stopping the event propagation and returning its own result to the client)', function() {
      const task = createTask(BEFORE_CREATE, [{}, {}, { name: 'John', id: 1 }]);

      function handler() {
        return { name: 'Dou', id: 2 };
      }

      return invokeAndParse(task, modelStub(handler)).then(res => {
        should.not.exists(res.exception);

        res.arguments[0].prematureResult.should.be.eql({ name: 'Dou', id: 2 });
      });
    });
  });

  describe('in [after] event phase', function() {
    it('should provide succeeded server result in {response} handler argument', function() {
      const result = { name: 'John', id: 1 };
      const wrappedResult = resultWrapper.executionResult(null, result);
      const task = createTask(AFTER_CREATE, [{}, {}, wrappedResult]);

      function handler(req, res) {
        should.not.exist(res.error);
        should.exist(res.result);
        res.result.should.be.eql(result);
      }

      return invokeAndParse(task, modelStub(handler)).then(res => {
        should.not.exists(res.exception);

        res.arguments[2].should.be.eql(wrappedResult);
      });
    });

    it('should provide errored server result in {response} handler argument', function() {
      const error = 'error';
      const erredResult = resultWrapper.executionResult(error);
      const task = createTask(AFTER_CREATE, [{}, {}, erredResult]);

      const handler = function(req, res) {
        should.not.exist(res.result);
        should.exist(res.error);
        res.error.exceptionMessage.should.be.eql(error);

        throw new Error(error);
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments.should.be.empty();
        res.exception.exceptionMessage.should.be.eql(error);
      });
    });

    it('should allow modifying server result by returning new value', function() {
      const task = createTask(AFTER_CREATE, [{}, {}, resultWrapper.executionResult(null, {
        name: 'John',
        id  : 1
      })]);

      function handler() {
        return { name: 'Dou', id: 2 };
      }

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].result.should.be.eql({ name: 'Dou', id: 2 });
      });
    });

    it('should allow result modifying via setting {res.result} a new value', function() {
      const task = createTask(AFTER_CREATE, [{}, {}, resultWrapper.executionResult({ name: 'John', id: 1 })]);

      function handler(req, res) {
        res.result = { name: 'Dou', id: 2 };
      }

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].result.should.be.eql({ name: 'Dou', id: 2 });
      });
    });
  });

  describe('for async events', function() {
    it('should not provide [success] and [error] callbacks', function() {
      function handler(req, res) {
        should.not.exist(res.success);
        should.not.exist(res.error);
      }

      return invokeAndParse(createTask(AFTER_CREATE, [], true), modelStub(handler));
    });

    it('should not return any result', function() {
      const task = createTask(AFTER_CREATE, [], true);

      function handler() {
      }

      return invokeAndParse(task, modelStub(handler)).should.be.fulfilledWith(undefined);
    });
  });
});