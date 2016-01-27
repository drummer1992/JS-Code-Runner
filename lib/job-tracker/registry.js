'use strict';

const redis     = require('redis'),
      denodeify = require('../util/promise').denodeify;

class BackendlessRegistry {
  constructor(host, port) {
    this.client = redis.createClient(port, host);
  }

  set(key, value) {
    let set = denodeify(this.client.set.bind(this.client));

    return set(key, value);
  }

  expire(sessionId, ttl) {
    let expire = denodeify(this.client.expire.bind(this.client));

    return expire(sessionId, ttl);
  }

  stop() {
    this.client.stop();
  }
}

const store = {};

module.exports = {
  get(host, port) {
    let key = host + port;
    let result = store[key];

    if (!result) {
      result = store[key] = new BackendlessRegistry(host, port);
    }

    return result;
  }
};