const ServerCode = require('../services/server-code'),
      registry   = require('./registry'),
      uuid       = require('node-uuid').v4();

class JobTracker {
  constructor() {
    this.id = uuid();
    this.debugId = null;
  }

  start() {
  }

  register() {
    registry.set();
  }

  registerInBackendless() {
    return ServerCode.registerRunner()
      .then(debugId => (this.debugId = debugId));
  }

  keepAlive() {

  }
}

module.exports = JobTracker;