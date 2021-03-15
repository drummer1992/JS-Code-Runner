'use strict'

const cluster = require('cluster')
const EventEmitter = require('events')
const OS = require('os')
const path = require('path')
const ServerCodeEvents = require('../events')

const logger = require('../../util/logger')
const LongWaiter = require('../../util/long-waiter')

const WORKER_TEARDOWN_TIME = 2000 //2 seconds
const WARN_STATUS_TIMEOUT = 5000 //5 seconds

const Events = {
  READY_FOR_NEXT_TASK: 'READY_FOR_NEXT_TASK',
  TASK_PROCESSED     : 'TASK_PROCESSED',
}

const Status = {
  CRITICAL: 'critical',
  WARNING : 'warning',
  GOOD    : 'good',
}

const StatusThresholds = {
  [Status.CRITICAL]: 0.9,
  [Status.WARNING] : 0.7,
}

class WorkersBroker extends EventEmitter {
  constructor(options, workerRunOptions) {
    super()

    cluster.setupMaster({
      exec  : path.resolve(__dirname, './cloud-worker.js'),
      args  : [],
      silent: !!logger.winston
    })

    this.status = Status.GOOD

    this.workerRunOptions = workerRunOptions

    this.options = options

    this.heartbeatTimeout = this.options.heartbeat.timeout * 1000

    this.concurrentWorkersLimit = this.options.concurrent || OS.cpus().length

    if (this.options.cache) {
      if (this.options.cache === true) {
        this.options.cache = { limit: 4 * this.concurrentWorkersLimit }
      }

      this.cachedWorkersLimit = this.options.cache.limit
    }

    this.idleWorkers = []
    this.cachedWorkers = []
    this.busyWorkers = []

    cluster.on('exit', this.onWorkerExit.bind(this))
    cluster.on('message', this.onWorkerMessage.bind(this))

    this.startWorkersHeartbeatTimer()
    this.startStatusWatcher()
  }

  async stop() {
    clearInterval(this.statusWatcherTimer)

    logger.info('Wait until each worker finished processing its current task')

    this.stopper = new LongWaiter(() => {
      logger.info(`remains ${this.busyWorkers.length} busy workers`)

      return !this.busyWorkers.length
    })

    await this.stopper.wait()

    logger.info('pull of the busy workers is empty')
  }

  isCacheEnabled() {
    return !!this.cachedWorkersLimit
  }

  startWorkersHeartbeatTimer() {
    setInterval(() => {
      getAllWorkers().forEach(worker => {
        if (worker.heartbeat + this.heartbeatTimeout < Date.now()) {
          this.killWorker(worker, (
            `Worker expired due to heartbeat timeout (${this.heartbeatTimeout}ms), ` +
            `the last ping was ${timeFromLastPing(worker)}ms ago` +
            ` [${getKilledWorkerDetails(worker)}]`
          ))
        }
      })
    }, this.heartbeatTimeout)
  }

  updateStatus() {
    const currentWorkersLoad = this.getCurrentLoad()

    if (currentWorkersLoad > StatusThresholds[Status.CRITICAL]) {
      this.status = Status.CRITICAL
    } else if (currentWorkersLoad > StatusThresholds[Status.WARNING]) {
      this.status = Status.WARNING
    } else {
      this.status = Status.GOOD
    }
  }

  startStatusWatcher() {
    let delayShowingMessage = null

    this.statusWatcherTimer = setInterval(() => {
      this.updateStatus()

      if (this.status !== Status.GOOD) {
        if (delayShowingMessage) {
          const startedTimeAgo = Date.now() - delayShowingMessage

          if (startedTimeAgo > WARN_STATUS_TIMEOUT) {
            logger.warn(
              `CodeRunner status is [${this.status}] ` +
              `started ${parseInt(startedTimeAgo / 1000)} seconds ago ${JSON.stringify(this.getStats())}`
            )
          }
        } else {
          delayShowingMessage = Date.now()
        }
      } else {
        delayShowingMessage = null
      }
    }, 1000)
  }

  async startNewWorker() {
    const time = timeMarker()

    const worker = cluster.fork({
      RUN_OPTIONS: JSON.stringify(this.workerRunOptions)
    })

    worker.heartbeat = Date.now()

    try {
      await new Promise(resolve => {
        function onMessageFromWorker(message) {
          if (message === 'started') {
            worker.process.removeListener('message', onMessageFromWorker)

            resolve()
          }
        }

        worker.process.on('message', onMessageFromWorker)

        if (logger.winston && !logger.ignoreWorkersLog) {
          worker.process.stdout
            .pipe(logger.winston.createLogStream('info'))
            .pipe(logger.winston)

          worker.process.stderr
            .pipe(logger.winston.createLogStream('error'))
            .pipe(logger.winston)
        }
      })

      logger.info(`[${worker.process.pid}] Worker started in ${time()}`)

      this.relocateWorker(worker, this.idleWorkers)

    } catch (error) {
      this.killWorker(worker, error.message)
    }
  }

  processTask(task, worker) {
    if (task.timeout) {
      worker.expireTimer = this.createExpirationTimer(worker, task.timeout)
    }

    if (!this.isCacheEnabled()) {
      task.cacheable = false
    }

    worker.task = task
    worker.process.send({ task })

    this.relocateWorker(worker, this.busyWorkers)
  }

  createExpirationTimer(worker, timeout) {
    return setTimeout(() => {
      this.killWorker(worker, `Worker expired due to task timeout (${timeout}ms)`)
    }, timeout + WORKER_TEARDOWN_TIME)
  }

  destroyExpirationTimer(worker) {
    if (worker.expireTimer) {
      clearTimeout(worker.expireTimer)

      delete worker.expireTimer
    }
  }

  getCurrentLoad() {
    return this.busyWorkers.length / this.concurrentWorkersLimit
  }

  getAvailableWorkersCount() {
    return this.concurrentWorkersLimit - this.busyWorkers.length
  }

  getTotalWorkersCount() {
    return Object.keys(cluster.workers).length
  }

  async getWorkerForTask(appId, isTaskCacheable) {
    const isCacheEnabled = this.isCacheEnabled()

    if (isCacheEnabled && isTaskCacheable) {
      const cachedWorker = this.cachedWorkers.find(worker => worker.appId === appId)

      if (cachedWorker) {
        return cachedWorker
      }
    }

    const idleWorker = this.idleWorkers.pop()

    if (idleWorker) {
      if (isTaskCacheable) {
        idleWorker.appId = appId
      }

      return idleWorker
    }

    if (isCacheEnabled && this.cachedWorkersLimit <= this.cachedWorkers.length) {
      const leastActiveWorker = this.cachedWorkers.pop()

      if (leastActiveWorker) {
        this.killWorker(leastActiveWorker, 'Killed the least active cached worker, because cached pool is full')
      }
    }

    await this.startNewWorker()

    return this.getWorkerForTask(appId, isTaskCacheable)
  }

  relocateWorker(worker, newPlace) {
    const oldPlace = worker.currentPlace

    if (oldPlace) {
      const index = oldPlace.indexOf(worker)

      if (index !== -1) {
        oldPlace.splice(index, 1)
      }
    }

    worker.currentPlace = newPlace

    if (newPlace) {
      newPlace.unshift(worker)
    }

    if (oldPlace === this.busyWorkers || newPlace === this.busyWorkers) {
      if (this.stopper) {
        this.stopper.check()
      }

      if (this.isAvailableForTaskPrecessing()) {
        setImmediate(() => {
          this.emit(Events.READY_FOR_NEXT_TASK)
        })
      }
    }
  }

  isAvailableForTaskPrecessing() {
    return !this.stopper && this.busyWorkers.length < this.concurrentWorkersLimit
  }

  killAllAppWorkers(appId, reason) {
    const workers = getAllWorkers()

    workers.forEach(worker => {
      if (worker.appId === appId) {
        worker.toBeRemoved = true
        worker.toBeRemovedReason = reason
      }
    })

    this.cachedWorkers.forEach(worker => {
      if (worker.appId === appId) {
        this.killWorker(worker, reason)
      }
    })
  }

  killWorker(worker, reason) {
    this.relocateWorker(worker)

    if (logger.winston && !logger.ignoreWorkersLog) {
      worker.process.stdout.unpipe()
      worker.process.stderr.unpipe()
    }

    worker.killed = true

    // we use this instead of worker.kill(...) because we do not need to stop it gracefully
    worker.process.kill('SIGKILL')

    logger.info(`[${worker.process.pid}] Worker killed.`, reason || '')
  }

  getStats() {
    return {
      status       : this.status,
      load         : `${parseInt(this.getCurrentLoad() * 10000) / 100}%`,
      total        : this.getTotalWorkersCount(),
      available    : this.getAvailableWorkersCount(),
      idle         : this.idleWorkers.length,
      cached       : this.cachedWorkers.length,
      busy         : this.busyWorkers.length,
      maxConcurrent: this.concurrentWorkersLimit,
    }
  }

  onWorkerMessage(worker, message) {
    if (message.processed) {
      this.onWorkerTaskProcessed(worker, message)

    } else if (message === 'idling') {
      if (worker.task.cacheable && !worker.toBeRemoved) {
        delete worker.task

        this.onWorkerIdling(worker)
      } else {
        this.killWorker(worker, worker.toBeRemovedReason)
      }

    } else if (message === 'heartbeat') {
      this.onWorkerHeartbeat(worker)
    }
  }

  onWorkerTaskProcessed(worker, message) {
    const task = worker.task
    const taskResult = message.taskResult

    this.emit(Events.TASK_PROCESSED, task, taskResult)
  }

  onWorkerIdling(worker) {
    this.destroyExpirationTimer(worker)

    this.relocateWorker(worker, this.cachedWorkers)
  }

  onWorkerHeartbeat(worker) {
    worker.heartbeat = Date.now()
  }

  onWorkerExit(worker) {
    this.destroyExpirationTimer(worker)

    if (!worker.exitedAfterDisconnect && !worker.killed) {
      logger.info(`[${worker.process.pid}] Worker exited`)

      this.relocateWorker(worker)
    }
  }
}

function getAllWorkers() {
  return Object.keys(cluster.workers).map(id => cluster.workers[id])
}

function timeMarker() {
  const time = process.hrtime()

  return () => {
    const duration = process.hrtime(time)
    const ms = duration[0] * 1000 + duration[1] / 1e6

    return `${ms.toFixed(3)}ms`
  }
}

function getKilledWorkerDetails(worker) {
  const { appId, task } = worker
  const details = [`appId: ${appId}`]

  if (task.deploymentModelName) {
    details.push(`model: ${task.deploymentModelName}`)
  }

  if (task.className) {
    const service = task.className.replace('services.', '')
    details.push(`service: ${service}`)
  }

  if (task.method) {
    details.push(`method: ${task.method}`)
  }

  if (task.eventId) {
    const event = ServerCodeEvents.get(task.eventId)

    details.push(`handler: ${event.provider.id}(${event.provider.id === 'timer' ? task.target : event.name})`)
  }

  if (task.provider) {
    details.push(`file-path: ${task.provider}`)
  }

  return details.join(', ')
}

function timeFromLastPing(worker) {
  return worker.heartbeat && Date.now() - worker.heartbeat
}

WorkersBroker.Events = Events

module.exports = WorkersBroker



