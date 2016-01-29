'use strict';

const redis     = require('redis'),
      denodeify = require('../util/promise').denodeify;

class BackendlessRegistry {
  constructor(host, port) {
    this.client = redis.createClient(port, host);

    this.createAliases(['set', 'expire', 'blpop']);
  }

  createAliases(clientCommands) {
    clientCommands.forEach(command => {
      this[command] = denodeify(this.client[command], this.client);
    })
  }

  stop() {
    this.client.stop();
  }
}

module.exports = BackendlessRegistry;