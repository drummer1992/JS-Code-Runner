'use strict'

const EventEmitter = require('events').EventEmitter,
      redis        = require('redis'),
      promisifyAll = require('../../util/promise').promisifyNodeAll,
      logger       = require('../../util/logger')

const REDIS_CONNECTION_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const REDIS_EXPIRE_KEY_NOT_EXISTS_RESP = 0
const DEFAULT_REDIS_GETTER_CLIENTS_COUNT = 1

class MessagesBroker extends EventEmitter {
  constructor(connectionInfo, gettersCount) {
    super()

    this.connectionInfo = connectionInfo

    this.gettersCount = gettersCount || DEFAULT_REDIS_GETTER_CLIENTS_COUNT
    this.getters = []

    this.setter = null
    this.subscriber = null

    this.subscribed = false
  }

  createClient(name, isMainClient) {
    return new Promise(resolve => {
      const client = this[name] = redis.createClient(Object.assign({}, this.connectionInfo, {
        retry_strategy: options => {
          const nextReconnectionDelay = Math.min(options.attempt * 500, 5000)

          if (isMainClient) {
            if (options.total_retry_time > REDIS_CONNECTION_TIMEOUT) {
              return this.emit('error', new Error('Unable to connect to Redis for 5 minutes'))
            }

            if (options.error) {
              logger.error(
                `${options.error.message}, will try to reconnect in: ${nextReconnectionDelay / 1000} seconds`
              )
            }
          }

          return nextReconnectionDelay
        }
      }))

      promisifyAll(client, ['set', 'expire', 'blpop', 'publish', 'del'])

      //ignore redis deprecation warnings
      client.on('warning', () => undefined)
      client.on('error', error => {
        if (isMainClient) {
          logger.error(error.message)
        }
      })

      client.once('ready', () => {
        if (isMainClient) {
          client.on('connect', () => {
            logger.info('Connection with Redis has been restored')

            this.emit('reconnect')
          })
        }

        resolve()
      })
    })
  }

  forEachGetterClient(iterator) {
    for (let i = 0; i < this.gettersCount; i++) {
      iterator(i)
    }
  }

  init() {
    const getters = []

    this.forEachGetterClient(index => {
      const getterName = composeGetterClientName(index)

      getters.push(this.createClient(getterName, !this.getters.length))

      this.getters.push(this[getterName])
    })

    return Promise.all([
      ...getters,
      this.createClient('setter'),
      this.createClient('subscriber')
    ])
  }

  end() {
    const getters = []

    this.forEachGetterClient(index => {
      const getter = this[composeGetterClientName(index)]

      if (getter) {
        getters.push(getter)
      }
    })

    return Promise.all([
      ...getters,
      this.setter && this.setter.end(false),
      this.subscriber && this.subscriber.end(false)
    ])
  }

  async expireKey(key, ttl, keyDescription) {
    keyDescription = keyDescription || key

    const result = await this.setter.expire(key, ttl)

    if (result === REDIS_EXPIRE_KEY_NOT_EXISTS_RESP) {
      throw new Error(`${keyDescription} doesn't exist on server`)
    }
  }

  async getTask(tasksChannel) {
    const getter = this.getters.pop()

    let msg

    try {
      msg = await getter.blpop(tasksChannel, 0)
    } finally {
      this.getters.push(getter)
    }

    if (msg && msg.length) {
      try {
        return JSON.parse(msg[1])
      } catch (e) {
        throw new Error('Unable to parse received task. ' + e.message)
      }
    }
  }

  setTaskResult(task, result) {
    const responseChannel = task.responseChannelId

    return this.setter.publish(responseChannel, result)
  }

  subscribe(event, callback) {
    if (!this.subscribed) {
      this.subscriber.on('message', (channel, message) => {
        let parsedMessage = null

        try {
          parsedMessage = JSON.parse(message)
        } catch (e) {
          parsedMessage = message
        }

        this.emit(channel, parsedMessage)
      })

      this.subscribed = true
    }

    this.on(event, callback)

    this.subscriber.subscribe(event)
  }
}

function composeGetterClientName(index) {
  return `getter_${index}`
}

module.exports = MessagesBroker