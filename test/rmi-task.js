'use strict';

const mockery      = require('mockery'),
      should       = require('should'),
      path         = require('path'),
      events       = require('../lib/server-code/events'),
      invokeMethod = require('../lib/server-code/runners/tasks/invoke-method');

const DATA = events.providers.DATA;

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

let stubs = 0;

function createModelForTask(task, handlerFn) {
  const event = events.types.byId[task.eventId];
  const handlerName = event.name + (task.async ? '' : 'Sync'); //TODO: flip logic
  const handlerStubId = 'Stub Handler #' + (++stubs);
  const result = {
    app       : {id: 'id', secretKey: 'key', version: 'version'},
    getHandler: () => ({id: task.eventId, provider: handlerStubId})
  };

  mockery.enable();
  mockery.registerMock(path.resolve(handlerStubId), function(bless) {
    return bless.serverCode.EventsHandler.forProvider(event.provider)(task.target, {[handlerName]: handlerFn});
  });

  return result;
}

describe('[invoke-method] task', function() {
  afterEach(function() {
    mockery.disable();
  });

  it('should handle unsupported event', function() {
    return invokeMethod({eventId: -1}, {handlers: []})
      .then(JSON.parse)
      .then(res => {
        should.exist(res.exception)
        res.exception.exceptionMessage.should.startWith('Integrity violation');
      })
  });

  it('should handle missed handler event', function() {
    const stubModel = {
      getHandler: () => (null)
    };

    return invokeMethod({eventId: DATA.beforeCreate.id}, stubModel)
      .then(JSON.parse)
      .then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.startWith('Integrity violation');
      })
  });

  it('should handle event with missed handler module', function() {
    const stubModel = {
      getHandler: () => ({provider: 'some/unexisting/handler/module'})
    };

    return invokeMethod({eventId: DATA.beforeCreate.id}, stubModel)
      .then(JSON.parse)
      .then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.startWith('Cannot find module');
      })
  });

  it('should handle script errors in handler function', function() {
    const task = {eventId: DATA.beforeCreate.id};
    const model = createModelForTask(task, () => {
      throw new Error('Error in Handler!');
    });

    return invokeMethod(task, model)
      .then(JSON.parse)
      .then(res => {
        should.exist(res.exception);
        res.exception.exceptionMessage.should.be.eql('Error in Handler!');
      });
  });

  it('should allow input params modifying', function() {
    const object = {name: 'John'};
    const context = {};
    const task = {eventId: DATA.beforeCreate.id, arguments: encodeArgs([context, object])};
    const handler = function(req, res) {
      req.context.should.be.eql(context);
      req.object.should.be.eql(object);

      req.object = {name: 'Dou'};
      res.success();
    };

    return invokeMethod(task, createModelForTask(task, handler))
      .then(JSON.parse)
      .then((result) => {
        should.not.exist(result.exception);
        should.exist(result.arguments);

        const args = decodeArgs(result.arguments);

        args[0].should.be.eql(context);
        args[1].should.be.eql({name: 'Dou'});
      });
  });

  it('should allow result modifying via setting {res.result} a new value', function() {
    const task = {eventId: DATA.afterCreate.id, arguments: encodeArgs([{}, {}, {name: 'John', id: 1}])};
    const handler = function(req, res) {
      res.result = {name: 'Dou', id: 2};
      res.success();
    };

    return invokeMethod(task, createModelForTask(task, handler))
      .then(JSON.parse)
      .then((result) => {
        should.exist(result.arguments);
        decodeArgs(result.arguments)[2].should.be.eql({name: 'Dou', id: 2});
      });
  });

  it('should allow result modifying via calling {res.success} with value', function() {
    const task = {eventId: DATA.afterCreate.id, arguments: encodeArgs([{}, {}, {name: 'John', id: 1}])};
    const handler = (req, res)=> res.success({name: 'Dou', id: 2});

    return invokeMethod(task, createModelForTask(task, handler))
      .then(JSON.parse)
      .then((result) => {
        should.exist(result.arguments);
        decodeArgs(result.arguments)[2].should.be.eql({name: 'Dou', id: 2});
      });
  });
});