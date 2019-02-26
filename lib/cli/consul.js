'use strict'

const CONSUL_HOST = process.env.BL_CONSUL_HOST
const CONSUL_PORT = process.env.BL_CONSUL_PORT

const COMMON_BACKENDLESS_COMFIG_ITEMS = ['apiUrl', 'apiHost', 'apiPort', 'apiProtocol', 'apiUri', 'repoPath']

delete process.env.BL_CONSUL_HOST
delete process.env.BL_CONSUL_PORT

if (CONSUL_PORT && !CONSUL_HOST) {
  throw new Error('BL_CONSUL_HOST and BL_CONSUL_PORT must be both specified in ENV.')
}

module.exports = async function enrichWithConsul(options) {
  if (CONSUL_HOST) {
    const BackendlessConsul = require('backendless-consul-config-provider')

    const consulConfig = await BackendlessConsul.provide({
      url       : 'http://' + (CONSUL_PORT ? `${CONSUL_HOST}:${CONSUL_PORT}` : CONSUL_HOST),
      serviceKey: 'config/coderunner/js/',
      extraKeys : require('./consul.json'),
    })

    mergeObjects(options, normalizeConsulConfig(consulConfig))
  }
}

function normalizeConsulConfig(config) {
  config.backendless = config.backendless || {}

  COMMON_BACKENDLESS_COMFIG_ITEMS.forEach(prop => {
    config.backendless[prop] = config[prop]

    delete config[prop]
  })

  if (isObject(config.redis)) {
    config.backendless.msgBroker = Object.assign(config.backendless.msgBroker || {}, config.redis)

    delete config.redis
  }

  return config
}

function isObject(value) {
  return typeof value === 'object' && value !== null
}

function mergeObjects(target, source) {
  const keys = Object.keys(target).concat(Object.keys(source)).reduce((memo, key) => {
    if (!memo.includes(key)) {
      memo.push(key)
    }

    return memo
  }, [])

  keys.forEach(key => {
    const isTargetValueObject = isObject(target[key])
    const isSourceValueObject = isObject(source[key])

    if (isTargetValueObject && isSourceValueObject) {
      mergeObjects(target[key], source[key])

    } else if (source[key] !== undefined) {
      target[key] = source[key]
    }
  })
}
