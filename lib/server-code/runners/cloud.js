'use strict'

module.exports = opts => {
  const CloudMaster = require('./cloud-master')

  return new CloudMaster(opts)
}
