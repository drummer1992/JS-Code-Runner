'use strict'

const EventEmitter = require('events').EventEmitter,
      redis        = require('redis'),
      promisifyAll = require('../../util/promise').promisifyNodeAll,
      logger       = require('../../util/logger')

const REDIS_EXPIRE_KEY_NOT_EXISTS_RESP = 0

class MessagesBroker extends EventEmitter {
  constructor(connectionInfo, splitGetSet) {
    super()

    this.connectionInfo = connectionInfo
    this.splitGetSet = splitGetSet
    this.getter = null
    this.setter = null
    this.subscriber = null

    this.subscribed = false
  }

  getSetter() {
    return this.splitGetSet ? this.setter : this.getter
  }

  createClient(name, isMainClient) {
    return new Promise(resolve => {
      const client = this[name] = redis.createClient(Object.assign({}, this.connectionInfo, {
        retry_strategy: options => {
          const nextReconnectionDelay = Math.min(options.attempt * 500, 5000)

          if (options.total_retry_time > 2000 && (5 * 60 * 1000)) {
            const reconnectTimeoutError = new Error('Unable to connect to Redis for 5 minutes')

            if (isMainClient) {
              this.emit('error', reconnectTimeoutError)
            }

            return reconnectTimeoutError
          }

          if (isMainClient && options.error) {
            logger.error(`${options.error.message}, will try to reconnect in: ${nextReconnectionDelay / 1000} seconds`)
          }

          return nextReconnectionDelay
        }
      }))

      promisifyAll(client, ['set', 'expire', 'blpop', 'publish', 'del'])

      //ignore redis deprecation warnings
      client.on('warning', () => undefined)
      client.on('error', error => {
        console.log(error)
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

  init() {
    const clients = []

    clients.push(this.createClient('subscriber'))
    clients.push(this.createClient('getter', true))

    if (this.splitGetSet) {
      //a separate redis connection for blocked (blpop) 'get-task' operation
      clients.push(this.createClient('setter'))
    }

    return Promise.all(clients)
  }

  end() {
    return Promise.all([
      this.subscriber && this.subscriber.end(false),
      this.getter && this.getter.end(false),
      this.setter && this.setter.end(false)
    ])
  }

  async expireKey(key, ttl, keyDescription) {
    keyDescription = keyDescription || key

    const result = await this.getSetter().expire(key, ttl)

    if (result === REDIS_EXPIRE_KEY_NOT_EXISTS_RESP) {
      throw new Error(`${keyDescription} doesn't exist on server`)
    }
  }

  async getTask(tasksChannel) {
    const msg = await this.getter.blpop(tasksChannel, 0)

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

    return this.getSetter().publish(responseChannel, result)
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

module.exports = MessagesBroker