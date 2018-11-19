'use strict'

module.exports = opts => ({
  start() {
    return require('./cloud-master')(opts)
  }
})