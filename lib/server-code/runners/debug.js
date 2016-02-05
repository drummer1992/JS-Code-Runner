"use strict";

const logger              = require('../../util/logger'),
      redis               = require('redis'),
      promiseWhile        = require('../../util/promise').promiseWhile,
      denodeify           = require('../../util/promise').denodeify,
      buildModel          = require('../model').build,
      ServerCodeService   = require('../services/server-code'),
      tasksExecutor       = require('./tasks/executor');

const TASKS_AWAIT_TIMEOUT = 10;
const commands = ['set', 'expire', 'blpop', 'rpush', 'del'];

class ThenRedis {
  constructor(opts) {
    this.client = redis.createClient(opts.port, opts.host);

    commands.forEach(cmd => {
      this[cmd] = denodeify(this.client[cmd], this.client);
    })
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
      //TODO: create ticket on backend guys why it's an array
      .then(task => task && task[1] && JSON.parse(task[1]))
      .catch(e => {
        logger.error('Error while waiting for tasks: ' + e);
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
    this.scs = new ServerCodeService(opts.app, opts.backendless.apiServer);
    this.model = buildModel(opts.app);

    this.messageBroker = new ThenRedis(opts.backendless.messageBroker);

    //We need a separate redis connection for 'blpop' operation due to its blocking nature
    this.taskAcquirer = new TaskAcquirer(opts.backendless.messageBroker, opts.app.id);
  }

  start() {
    this.addShutdownHook();

    Promise.resolve()
      .then(() => this.registerRunner())
      .then(() => this.keepDebugSessionAlive())
      .then(() => this.registerModel())
      .then(() => this.listenTasksChannel())
      .catch(err => {
        logger.error(err.message || err);
        this.stop();
      });

    return this;
  }

  addShutdownHook() {
    const hook = this.stop.bind(this);

    process.on('exit', hook);
    process.on('SIGINT', hook);
    process.on('SIGTERM', hook);
  }

  stop() {
    if (!this.stopped) {
      logger.info('Shutting down Code Runner. Please wait..');

      if (this.sessionRenewalTimer) {
        clearTimeout(this.sessionRenewalTimer);
      }

      if (this.debugSessionId) {
        this.scs.unregisterRunner();
        this.messageBroker.del(this.debugSessionId);
      }

      this.taskAcquirer.quit();
      this.messageBroker.quit();

      this.stopped = true;
    }
  }

  registerModel() {
    return this.scs.registerModel(this.model.serialize());
  }

  registerRunner() {
    return this.scs.registerRunner()
      .then(debugId => (this.debugSessionId = debugId));
  }

  keepDebugSessionAlive() {
    this.sessionRenewalTimer && clearInterval(this.sessionRenewalTimer);

    this.sessionRenewalTimer = setTimeout(() => {
      this.messageBroker.expire(this.debugSessionId, 60)
        .then(result => {
          let keyExists = result === 1;

          if (keyExists) {
            //TODO: danger! recursive function call may cause stack overflow issue.
            //Should be rewritten without recursion
            this.keepDebugSessionAlive();
          } else {
            throw new Error("Debug Session ID doesn't exist on server anymore");
          }
        })
        .catch(err => {
          logger.error(err.message || err);
          delete this.sessionRenewalTimer;

          if (!this.stopped) {
            logger.error('Oops.. Looks like we were disconnected. Trying to reconnect..');

            this.start();
          }
        });
    }, 45000);
  }

  listenTasksChannel() {
    logger.info('Waiting for Server Code tasks..');

    const running = () => !this.stopped;

    promiseWhile(running, () => this.taskAcquirer.getTask().then(task => task && this.processTask(task)));
  }

  processTask(task) {
    logger.info(`New task arrived! [id:${task.id}]`);

    tasksExecutor.execute(task, this.model)
      .then(result => {
        logger.info(`[${task.id}] Processing finished`);

        if (result) {
          logger.debug(`[${task.id}] Sending results to Redis`);

          return this.messageBroker.rpush(task.id, result)
            .then(()=> this.messageBroker.expire(task.id, 10))
            .then(()=> {
              logger.debug(`[${task.id}] Task results sent`);
            });
        }
      })
      .catch(err => {
        logger.debug(`Error during task execution. Task: ${task.id}. Error: ${err.message || err}`);
      });
  }
}

exports.start = function(opts) {
  logger.info('Starting Debug Code Runner...');

  return new DebugCodeRunner(opts).start();
};