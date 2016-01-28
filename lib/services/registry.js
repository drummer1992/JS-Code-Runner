'use strict';

const redis     = require('redis'),
      denodeify = require('../util/promise').denodeify;

class BackendlessRegistry {
  constructor(host, port) {
    this.client = redis.createClient(port, host);

    this.set = denodeify(this.client.set, this.client);
    this.expire = denodeify(this.client.expire.bind(this.client));
  }

  stop() {
    this.client.stop();
  }
}

module.exports = BackendlessRegistry;