'use strict';

const logger           = require('../../util/logger'),
      file             = require('../../util/file'),
      redis            = require('redis'),
      promiseWhile     = require('../../util/promise').promiseWhile,
      denodeify        = require('../../util/promise').promisifyNode,
      ApiServerService = require('../services/api-server'),
      tasksExecutor    = require('./tasks/executor'),
      ServerCodeModel  = require('../model');

const TASKS_AWAIT_TIMEOUT = 10;
const SESSION_TTL = 60;
const SESSION_RENEWAL_INTERVAL = 45000;
const REDIS_TIMEOUT_SET_RESP = 1;

const commands = ['set', 'expire', 'blpop', 'rpush', 'del'];

class ThenRedis {
  constructor(opts) {
    this.client = redis.createClient(opts.port, opts.host);

    commands.forEach(cmd => {
      this[cmd] = denodeify(this.client[cmd], this.client);
    });
  }

  quit() {
    this.client.quit(true);
  }
}

class TaskAcquirer {
  constructor(redisOpts, channel) {
    this.client = new ThenRedis(redisOpts);
    this.channel = channel;
  }

  getTask() {
    return this.client.blpop(this.channel, TASKS_AWAIT_TIMEOUT)
      .then(task => task && task[1] && JSON.parse(task[1])) //TODO: refactor server side to get rid of an array
      .catch(e => {
        logger.error(`Error while waiting for tasks: ${e}`);
        throw e;
      });
  }

  quit() {
    this.client.quit();
  }
}

class DebugCodeRunner {
  constructor(opts) {
    this.options = opts;
    this.apiServer = new ApiServerService(opts.app, opts.backendless.apiServer);

    this.messageBroker = new ThenRedis(opts.backendless.msgBroker);
    this.model = this.buildModel();

    //We need a separate redis connection for 'blpop' operation due to its blocking nature
    this.taskAcquirer = new TaskAcquirer(opts.backendless.msgBroker, opts.app.id);
  }

  start() {
    Promise.resolve()
      .then(() => this.registerRunner())
      .then(() => this.keepDebugSessionAlive())
      .then(() => this.registerHandlers())
      //.then(() => this.registerServices())
      .then(() => this.listenTasksChannel())
      .catch(err => {
        logger.error(err.message || err);

        this.stop();
      });

    return this;
  }

  buildModel() {
    const files = file.expand(this.options.app.files, { nodir: true });

    return ServerCodeModel.build(process.cwd(), files);
  }

  stop() {
    const stopTasks = [];

    if (!this.stopped) {
      if (this.sessionRenewalTimer) {
        clearTimeout(this.sessionRenewalTimer);
      }

      if (this.debugSessionId) {
        stopTasks.push(this.apiServer.unregisterRunner());
        stopTasks.push(this.messageBroker.del(this.debugSessionId));
      }

      this.taskAcquirer.quit();
      this.messageBroker.quit();

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
        .then(() => Promise.all(services.map((s) => {
          return this.apiServer.registerDebugService(this.model.describeService(s.name));
        })));
    }
  }

  registerRunner() {
    return this.apiServer.registerRunner()
      .then(debugId => (this.debugSessionId = debugId));
  }

  keepDebugSessionAlive() {
    this.sessionRenewalTimer && clearTimeout(this.sessionRenewalTimer);

    this.sessionRenewalTimer = setTimeout(() => {
      this.messageBroker.expire(this.debugSessionId, SESSION_TTL)
        .then(result => {
          const success = result === REDIS_TIMEOUT_SET_RESP;

          if (success) {
            this.keepDebugSessionAlive();
          } else {
            throw new Error("Debug Session ID doesn't exist on server anymore");
          }
        })
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

    const running = () => !this.stopped;

    const getAndProcessTask = () => {
      return this.taskAcquirer.getTask()
        .then(task => task && this.processTask(task));
    };

    promiseWhile(running, getAndProcessTask);
  }

  processTask(task) {
    logger.info(`New task arrived! [id:${task.id}]`);

    tasksExecutor.execute(task, this.options, this.model)
      .then(result => {
        logger.info(`[${task.id}] Processing finished`);

        if (result) {
          logger.debug(`[${task.id}] Sending results to Redis`);

          return this.messageBroker.rpush(task.id, result)
            .then(() => this.messageBroker.expire(task.id, 10))
            .then(() => logger.debug(`[${task.id}] Task results sent`));
        }
      })
      .catch(err => {
        logger.info(`Error during task execution. Task: ${task.id}. Error: ${err.message || err}`);
      });
  }
}

exports.start = function(opts) {
  logger.info('Starting Debug Code Runner...');

  return new DebugCodeRunner(opts).start();
};