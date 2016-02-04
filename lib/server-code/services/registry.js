'use strict';

const redis     = require('redis'),
      denodeify = require('../../util/promise').denodeify;

class BackendlessRegistry {
  constructor(host, port) {
    this.client = redis.createClient(port, host);
    this.client.on('error', function(err) {
      console.log(err);
    });

    this.createAliases(['set', 'expire', 'blpop', 'rpush', 'del']);
  }

  createAliases(clientCommands) {
    clientCommands.forEach(command => {
      this[command] = denodeify(this.client[command], this.client);
    })
  }

  stop() {
    this.client.quit(true);
  }
}

module.exports = BackendlessRegistry;