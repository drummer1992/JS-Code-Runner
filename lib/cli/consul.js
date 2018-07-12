'use strict'

const CONSUL_HOST = process.env.BL_CONSUL_HOST
const CONSUL_PORT = process.env.BL_CONSUL_PORT

if (CONSUL_PORT && !CONSUL_HOST) {
  throw new Error('BL_CONSUL_HOST and BL_CONSUL_PORT must be both specified in ENV.')
}

const CONSUL_CONFIG_ROOT_KEY = 'config/coderunner/js/'
const CONSUL_CONFIG_VERSION = '5.1.0'

module.exports = async function enrichWithConsul(options) {
  if (CONSUL_HOST) {
    const BackendlessConsul = require('backendless-consul-config-provider')

    const consulConfig = await BackendlessConsul.provide({
      url      : 'http://' + (CONSUL_PORT ? `${CONSUL_HOST}:${CONSUL_PORT}` : CONSUL_HOST),
      version  : CONSUL_CONFIG_VERSION,
      rootKey  : CONSUL_CONFIG_ROOT_KEY,
      extraKeys: require('./consul.json'),
    })

    mergeObjects(options, normalizeConsulConfig(consulConfig))
  }
}

function normalizeConsulConfig(config) {
  if (isObject(config.redis)) {
    config.backendless = config.backendless || {}
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
    if (memo.indexOf(key)) {
      memo.push(key)
    }

    return memo
  }, [])

  keys.forEach(key => {
    const isTargetValueObject = isObject(target[key])
    const isSourceValueObject = isObject(source[key])

    if (isTargetValueObject && isSourceValueObject) {
      target[key] = mergeObjects(target[key], source[key])

    } else if (isSourceValueObject) {
      target[key] = source[key]
    }
  })
}
