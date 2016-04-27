'use strict';

const events           = require('events'),
      logger           = require('../../util/logger'),
      file             = require('../../util/file'),
      redis            = require('redis'),
      promiseWhile     = require('../../util/promise').promiseWhile,
      promisifyAll     = require('../../util/promise').promisifyNodeAll,
      ApiServerService = require('../services/api-server'),
      tasksExecutor    = require('./tasks/executor'),
      ServerCodeModel  = require('../model');

const TASKS_AWAIT_TIMEOUT = 10; //10 secs
const SESSION_TTL = 60; //60 secs
const SESSION_RENEWAL_INTERVAL = 45000; //45 secs
const REDIS_EXPIRE_KEY_NOT_EXISTS_RESP = 0;

class MessagesBroker extends events.EventEmitter {
  constructor(opts) {
    super();

    this.opts = opts;
    this.setter = null;
    this.getter = null;
  }

  createClient(name) {
    return new Promise((resolve, reject) => {
      const client = this[name] = redis.createClient(this.opts);

      promisifyAll(client, ['set', 'expire', 'blpop', 'rpush', 'del']);

      client.once('error', err => {
        logger.error('Unable to connect to Messages Broker');
        reject(err);
      });
      
      client.once('ready', () => {
        client.on('error', (err) => {
          this.emit('error', err);
        });

        resolve();
      });
    });
  }

  init() {
    return Promise.all([
      this.createClient('getter'), //a separate redis connection for blocked (blpop) 'get-task' operation
      this.createClient('setter')
    ]);
  }

  end() {
    return Promise.all([
      this.getter && this.getter.end(false),
      this.setter && this.setter.end(false)
    ]);
  }

  expireKey(key, ttl, keyDescription) {
    keyDescription = keyDescription || key;

    return this.setter.expire(key, ttl)
      .then(result => {
        if (result === REDIS_EXPIRE_KEY_NOT_EXISTS_RESP) {
          throw new Error(`${keyDescription} doesn't exist on server`);
        }
      });
  }

  getTask(tasksQueue) {
    return this.getter.blpop(tasksQueue, TASKS_AWAIT_TIMEOUT);
  }

  setTaskResult(taskId, result) {
    return this.setter.rpush(taskId, result)
      .then(() => this.setter.expire(taskId, 10));
  }
}

class DebugCodeRunner {
  constructor(opts) {
    this.options = opts;

    this.apiServer = new ApiServerService(opts.app, opts.backendless.apiServer);

    this.messageBroker = new MessagesBroker(opts.backendless.msgBroker);
    this.messageBroker.on('error', (err) => this.stop(err));
  }

  init() {
    return Promise.resolve()
      .then(() => this.buildModel())
      .then(() => this.messageBroker.init());
  }

  start() {
    Promise.resolve()
      .then(() => this.registerRunner())
      .then(() => this.keepDebugSessionAlive())
      .then(() => this.registerHandlers())
      .then(() => this.registerServices())
      .then(() => this.listenTasksChannel())
      .catch(err => this.stop(err));

    return this;
  }

  buildModel() {
    const files = file.expand(this.options.app.files, { nodir: true });

    this.model = ServerCodeModel.build(process.cwd(), files);

    if (this.model.isEmpty()) {
      throw new Error('Nothing to Debug');
    }
  }

  stop(err) {
    const stopTasks = [];

    if (!this.stopped) {
      if (err) {
        logger.error(err.message || err);
      }

      if (this.sessionRenewalTimer) {
        clearTimeout(this.sessionRenewalTimer);
      }

      if (this.debugSessionId) {
        stopTasks.push(this.apiServer.unregisterRunner());
      }

      stopTasks.push(this.messageBroker.end());

      this.stopped = true;
    }

    return Promise.all(stopTasks);
  }

  registerHandlers() {
    return this.apiServer.registerModel(this.model);
  }

  registerServices() {
    const services = this.model.services.values();

    if (services.length) {
      return this.apiServer.unregisterDebugServices()
        .then(() => this.apiServer.registerDebugServices(services));
    }
  }

  registerRunner() {
    return this.apiServer.registerRunner()
      .then(debugId => (this.debugSessionId = debugId));
  }

  keepDebugSessionAlive() {
    this.sessionRenewalTimer && clearTimeout(this.sessionRenewalTimer);

    this.sessionRenewalTimer = setTimeout(() => {
      this.messageBroker.expireKey(this.debugSessionId, SESSION_TTL, 'Debug Session ID')
        .then(() => this.keepDebugSessionAlive())
        .catch(err => {
          logger.error(err.message || err);

          if (!this.stopped) {
            logger.error('Oops.. Looks like we were disconnected. Trying to reconnect..');

            this.start();
          }
        });
    }, SESSION_RENEWAL_INTERVAL);
  }

  listenTasksChannel() {
    logger.info('Waiting for Server Code tasks..');

    const tasksQueue = this.options.app.id;
    const running = () => !this.stopped;

    function parseTaskMsg(msg) {
      return msg && msg[1] && JSON.parse(msg[1]);
    }

    promiseWhile(running, () => {
      return this.messageBroker.getTask(tasksQueue)
        .then(parseTaskMsg)
        .then(task => task && this.processTask(task));
    });
  }

  processTask(task) {
    const msgBroker = this.messageBroker;
    
    function taskMsg(msg) {
      return `[${task.id}] ${msg}`;
    }

    function sendResult(result) {
      logger.info(taskMsg('Processing finished'));

      if (result) {
        logger.debug(taskMsg('Sending results to Redis'));

        msgBroker.setTaskResult(task.id, result)
          .then(() => logger.debug(taskMsg('Task results sent')));
      }
    }

    function logError(err) {
      logger.error(taskMsg(`Error during task execution. ${err.message || err}`));
    }

    logger.info(taskMsg('New task arrived!'));

    tasksExecutor.execute(task, this.options, this.model)
      .then(sendResult)
      .catch(logError);
  }
}

exports.start = function(opts) {
  logger.info('Starting Debug Code Runner...');

  const runner = new DebugCodeRunner(opts);

  return runner.init().then(() => runner.start());
};