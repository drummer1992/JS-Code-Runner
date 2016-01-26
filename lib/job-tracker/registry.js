const redis  = require('redis'),
      config = require('../config');

class BackendlessRegistry {
  constructor() {
    let registryConfig = config.get('backendless.registry');

    this.client = redis.createClient(registryConfig.port, registryConfig.host);
  }

  set(key, value) {
    return new Promise((resolve, reject) => {
      this.client.set(key, value, function(err, resp) {
        if (err) {
          return reject(err);
        }

        resolve(resp);
      });
    });
  }

  keepAlive(key) {
    //TODO: start timer of key TTL increasing
  }
}

module.exports = new BackendlessRegistry();