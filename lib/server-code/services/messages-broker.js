'use strict';

const EventEmitter = require('events').EventEmitter,
      redis        = require('redis'),
      promisifyAll = require('../../util/promise').promisifyNodeAll,
      logger       = require('../../util/logger');

const REDIS_EXPIRE_KEY_NOT_EXISTS_RESP = 0;

class MessagesBroker extends EventEmitter {
  constructor(connectionInfo, splitGetSet) {
    super();

    this.connectionInfo = connectionInfo;
    this.splitGetSet = splitGetSet;
    this.getter = null;
    this.setter = null;
  }

  getSetter() {
    return this.splitGetSet ? this.setter : this.getter;
  }

  createClient(name) {
    return new Promise((resolve, reject) => {
      const client = this[name] = redis.createClient(this.connectionInfo);

      const whenAttemptsExceeded = callback => error => {
        if (client.max_attempts && error.code !== 'CONNECTION_BROKEN') {
          logger.info(error.message + '. Trying to reconnect..');
          return;
        }

        callback(error);
      };

      promisifyAll(client, ['set', 'expire', 'blpop', 'publish', 'del']);

      //ignore redis deprecation warnings
      client.on('warning', () => undefined);
      client.on('error', whenAttemptsExceeded(reject));

      client.once('ready', () => {
        client.removeAllListeners('error');
        client.on('error', whenAttemptsExceeded(err => this.emit('error', err)));
        resolve();
      });
    });
  }

  init() {
    const clients = [];

    clients.push(this.createClient('getter'));

    if (this.splitGetSet) {
      //a separate redis connection for blocked (blpop) 'get-task' operation
      clients.push(this.createClient('setter'));
    }

    return Promise.all(clients);
  }

  end() {
    return Promise.all([
      this.getter && this.getter.end(false),
      this.setter && this.setter.end(false)
    ]);
  }

  expireKey(key, ttl, keyDescription) {
    keyDescription = keyDescription || key;

    return this.getSetter().expire(key, ttl)
      .then(result => {
        if (result === REDIS_EXPIRE_KEY_NOT_EXISTS_RESP) {
          throw new Error(`${keyDescription} doesn't exist on server`);
        }
      });
  }

  getTask(tasksChannel) {
    return this.getter.blpop(tasksChannel, 0).then(msg => {
      if (msg && msg.length) {
        try {
          return JSON.parse(msg[1]);
        } catch (e) {
          throw new Error('Unable to parse received task. ' + e.message);
        }
      }
    });
  }

  setTaskResult(task, result) {
    const responseChannel = task.responseChannelId;

    return this.getSetter().publish(responseChannel, result);
  }
}

module.exports = MessagesBroker;