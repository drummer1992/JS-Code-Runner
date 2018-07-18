'use strict';

const cluster = require('cluster');

module.exports = opts => ({
  start() {
    if (cluster.isMaster) {
      return require('./cloud-master')(opts);
    }

    if (opts.sandbox) {
      require('./cloud-security')
    }

    return require('./cloud-worker')(opts);
  }
});