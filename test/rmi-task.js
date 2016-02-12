'use strict';

const mockery      = require('mockery'),
      should       = require('should'),
      events       = require('../lib/server-code/events'),
      DATA         = events.providers.DATA,
      invokeMethod = require('../lib/server-code/runners/tasks/invoke-method');

require('mocha');

function stringToBytes(s) {
  return s.split('').map((c, i) => s.charCodeAt(i));
}

function encodeArgs(args) {
  return (args && args.length && stringToBytes(JSON.stringify(args))) || [];
}

function decodeArgs(args) {
  return (args && args.length && JSON.parse(String.fromCharCode.apply(String, args))) || [];
}

function modelStub(handlerFn) {
  return {
    invokeEventHandler: (eventId, target, req, res) => handlerFn(req, res)
  };
}

function createTask(event, args, async) {
  return {
    eventId  : event.id,
    async    : !!async,
    arguments: encodeArgs(args || [])
  }
}

function invokeAndParse(task, model) {
  return invokeMethod(task, model)
    .then(res => res && JSON.parse(res))
    .then(res => {
      if (res && res.arguments) {
        res.arguments = res.arguments && decodeArgs(res.arguments);
      }
      return res;
    });
}

function serverResult(err, result) {
  return {
    ___jsonclass:"com.backendless.servercode.ExecutionResult",
    result: result,
    exception: err && {
      message: err
    }
  }
}

describe('[invoke-method]] task executor', function() {
  beforeEach(function() {
    mockery.disable();
  });

  it('should fill [request] params', function() {
    const task = createTask(DATA.beforeCreate, [{}, {name: 'John'}]);
    const handler = (req, res) => {
      should.exist(req.item);
      req.item.should.be.eql({name: 'John'});
      res.success();
    };

    return invokeAndParse(task, modelStub(handler)).should.be.fulfilled();
  });

  describe('should handle', function() {
    it('unsupported event error', function() {
      return invokeAndParse({eventId: -1}, {handlers: []}).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.startWith('Integrity violation');
      })
    });

    it('model errors', function() {
      const erroredModel = {
        invokeEventHandler: () => {
          throw new Error('Model Error');
        }
      };

      return invokeAndParse(createTask(DATA.beforeCreate), erroredModel).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Model Error');
      })
    });

    it('handler execution timeout', function() {
      const task = createTask(DATA.beforeCreate);
      task.timeout = 1;

      const handler = function(req, res) {
        setTimeout(() => {
          res.success();
        }, 2);
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.equal('Task execution aborted due to timeout');
      });
    });

    it('errors thrown from handler', function() {
      const handler = () => {
        throw new Error('Error in Handler!');
      };

      return invokeAndParse(createTask(DATA.beforeCreate), modelStub(handler)).then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.be.eql('Error in Handler!');
      });
    });
  });

  describe('in [before] event phase', function() {
    it('should allow input parameters modifying', function() {
      const task = createTask(DATA.beforeCreate, [{}, {name: 'John'}]);
      const handler = function(req, res) {
        req.item = {name: 'Dou'};
        res.sendSuccess();
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[1].should.be.eql({name: 'Dou'});
      });
    });

    it('should allow short circuit feature (stopping the event propagation and returning its own result to the client)', function() {
      const task = createTask(DATA.beforeCreate, [{}, {}, {name: 'John', id: 1}]);
      const handler = (req, res) => res.sendSuccess({name: 'Dou', id: 2});

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[0].prematureResult.should.be.eql({name: 'Dou', id: 2});
      });
    });
  });

  describe('in [after] event phase', function() {
    it('should provide succeeded server result in {response} handler argument', function() {
      const result = {name: 'John', id: 1};
      const wrappedResult = serverResult(null, result);
      const task = createTask(DATA.afterCreate, [{}, {}, wrappedResult]);

      const handler = function(req, res) {
        should.not.exist(res.error);
        should.exist(res.result);
        res.result.should.be.eql(result);
        res.sendSuccess();
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].should.be.eql(wrappedResult);
      });
    });

    it('should provide errored server result in {response} handler argument', function() {
      const error = 'error';
      const erroredResult = serverResult(error);
      const task = createTask(DATA.afterCreate, [{}, {}, erroredResult]);

      const handler = function(req, res) {
        should.not.exist(res.result);
        should.exist(res.error);
        res.error.message.should.be.eql(error);

        res.sendError();
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments.should.be.empty();
        res.exception.exceptionMessage.should.be.eql(error);
      });
    });

    it('should allow modifying server result via calling {res.success} with value', function() {
      const task = createTask(DATA.afterCreate, [{}, {}, serverResult(null, {name: 'John', id: 1})]);
      const handler = (req, res) => res.sendSuccess({name: 'Dou', id: 2});

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].result.should.be.eql({name: 'Dou', id: 2});
      });
    });

    it('should allow result modifying via setting {res.result} a new value', function() {
      const task = createTask(DATA.afterCreate, [{}, {}, serverResult({name: 'John', id: 1})]);
      const handler = function(req, res) {
        res.result = {name: 'Dou', id: 2};
        res.sendSuccess();
      };

      return invokeAndParse(task, modelStub(handler)).then(res => {
        res.arguments[2].result.should.be.eql({name: 'Dou', id: 2});
      });
    });
  });

  describe('for async events', function() {
    it('should not provide [success] and [error] callbacks', function() {
      const handler = (req, res) => {
        should.not.exist(res.success);
        should.not.exist(res.error);
      };

      return invokeAndParse(createTask(DATA.afterCreate, [], true), modelStub(handler));
    });

    it('should not return any result', function() {
      return invokeAndParse(createTask(DATA.afterCreate, [], true), modelStub(() => {}))
        .should.be.fulfilledWith(undefined);
    });
  });
});