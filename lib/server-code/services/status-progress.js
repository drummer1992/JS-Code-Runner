'use strict'

const { wait } = require('../../util/promise')
const { compactDate } = require('../../util/date')
const logger = require('../../util/logger')
const request = require('backendless').Request

module.exports = class StatusProgress {
  static wait(options) {
    const instance = new this(options)

    return instance.wait()
  }

  constructor({ url, endMessageText, checkInterval }) {
    this.url = url
    this.endMessageText = endMessageText
    this.checkInterval = checkInterval || 500

    this.failed = false

    this.loadedMessagesCount = 0

    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve
      this.reject = reject

      this.loadNextStatus()
    })
  }

  async loadNextStatus() {
    const messages = await request.get(this.url).query({
      offset  : this.loadedMessagesCount,
      pagesize: 100,
    })

    this.loadedMessagesCount += messages.length

    messages.forEach(message => {
      const level = (message.level || 'info').toLowerCase()
      const loggerMethod = typeof logger[level] === 'function' ? level : 'info'

      const date = compactDate(new Date(message.date))

      if (level === 'error') {
        this.failed = true
      }

      logger[loggerMethod](`:: [Server ${date}] [${level}] ${message.message}`)
    })

    const lastMessage = messages[messages.length - 1]

    if (lastMessage && lastMessage.message && lastMessage.message.includes(this.endMessageText)) {
      if (this.failed) {
        this.reject(new Error('This has been finished with an error, see the log messages above'))
      } else {
        this.resolve()
      }
    } else {
      await wait(this.checkInterval)

      this.loadNextStatus()
    }
  }

  wait() {
    return this.promise
  }
}

