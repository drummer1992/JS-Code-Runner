'use strict';

const redis     = require('redis'),
      denodeify = require('../../util/promise').denodeify;

class BackendlessRegistry {
  constructor(host, port) {
    this.client = redis.createClient(port, host);

    this.createAliases(['set', 'expire', 'blpop', 'rpush', 'del']);
  }

  createAliases(clientCommands) {
    clientCommands.forEach(command => {
      this[command] = denodeify(this.client[command], this.client);
    })
  }

  stop() {
    console.log('Stopping redis client');
    this.client.quit(true);
  }
}

module.exports = BackendlessRegistry;