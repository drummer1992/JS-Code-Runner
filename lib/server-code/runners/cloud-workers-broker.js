'use strict'

const cluster = require('cluster')
const EventEmitter = require('events')
const OS = require('os')
const path = require('path')

const logger = require('../../util/logger')

const WORKER_TEARDOWN_TIME = 10000 //10 seconds

const Events = {
  READY_FOR_NEXT_TASK: 'READY_FOR_NEXT_TASK',
  TASK_PROCESSED     : 'TASK_PROCESSED',
}

class WorkersBroker extends EventEmitter {
  constructor(options, runOptions) {
    super()

    cluster.setupMaster({
      exec: path.resolve(__dirname, './cloud-worker.js'),
      args: []
    })

    this.runOptions = runOptions

    this.options = options

    this.heartbeatTimeout = this.options.heartbeat.timeout * 1000

    this.concurrentWorkersLimit = this.options.concurrent || OS.cpus().length
    this.activeWorkersLimit = this.options.limit || this.concurrentWorkersLimit

    this.idleWorkers = []
    this.cachedWorkers = []
    this.busyWorkers = []

    cluster.on('exit', this.onWorkerExit.bind(this))
    cluster.on('message', this.onWorkerMessage.bind(this))

    this.startWorkersHeartbeatTimer()
  }

  startWorkersHeartbeatTimer() {
    setInterval(() => {
      getAllWorkers().forEach(worker => {
        if (worker.heartbeat + this.heartbeatTimeout < Date.now()) {
          this.killWorker(worker, `Worker expired due to heartbeat timeout (${this.heartbeatTimeout}ms)`)
        }
      })
    }, this.heartbeatTimeout)
  }

  async startNewWorker() {
    const time = timeMarker()

    const worker = cluster.fork({
      RUN_OPTIONS: JSON.stringify(this.runOptions)
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
      })

      logger.info(`[${worker.process.pid}] Worker started in ${time()}`)

      this.relocatedWorker(worker, this.idleWorkers)

    } catch (error) {
      this.killWorker(worker, error.message)
    }
  }

  processTask(task, worker) {
    if (task.timeout) {
      worker.expireTimer = this.createExpirationTimer(worker, task.timeout)
    }

    worker.task = task
    worker.process.send({ task })

    this.relocatedWorker(worker, this.busyWorkers)
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

  async getWorkerForTask(appId, reuseCachedWorker) {
    if (reuseCachedWorker) {
      const cachedWorker = this.cachedWorkers.find(worker => worker.appId === appId)

      if (cachedWorker) {
        return cachedWorker
      }
    }

    const idleWorker = this.idleWorkers.pop()

    if (idleWorker) {
      idleWorker.appId = appId

      return idleWorker
    }

    if (this.cachedWorkers.length + this.busyWorkers.length >= this.activeWorkersLimit) {
      const leastActiveWorker = this.cachedWorkers.pop()

      if (leastActiveWorker) {
        this.killWorker(leastActiveWorker, 'Killed the least active cached worker, because cached pool is full')
      }
    }

    await this.startNewWorker()

    return this.getWorkerForTask(appId, reuseCachedWorker)
  }

  relocatedWorker(worker, newPlace) {
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
      if (this.isAvailableForTaskPrecessing()) {
        setImmediate(() => {
          this.emit(Events.READY_FOR_NEXT_TASK)
        })
      }
    }
  }

  isAvailableForTaskPrecessing() {
    return this.busyWorkers.length < this.concurrentWorkersLimit
  }

  killAllAppWorkers(appId, reason) {
    const workers = getAllWorkers()

    workers.forEach(worker => {
      if (worker.appId === appId) {
        this.killWorker(worker, reason)
      }
    })
  }

  killWorker(worker, reason) {
    logger.info(`[${worker.process.pid}] Worker killed.`, reason)

    this.relocatedWorker(worker)

    worker.killReason = reason
    worker.process.kill('SIGKILL')
  }

  getStats() {
    return {
      idle  : this.idleWorkers.length,
      cached: this.cachedWorkers.length,
      busy  : this.busyWorkers.length,
      total : Object.keys(cluster.workers).length,
    }
  }

  onWorkerMessage(worker, message) {
    if (message.processed) {
      this.onWorkerTaskProcessed(worker, message)

    } else if (message === 'idling') {
      this.onWorkerIdling(worker, message)

    } else if (message === 'heartbeat') {
      this.onWorkerHeartbeat(worker, message)
    }
  }

  onWorkerTaskProcessed(worker, message) {
    const task = worker.task
    const taskResult = message.taskResult

    this.destroyExpirationTimer(worker)

    delete worker.task

    this.emit(Events.TASK_PROCESSED, task, taskResult)
  }

  onWorkerIdling(worker) {
    this.relocatedWorker(worker, this.cachedWorkers)
  }

  onWorkerHeartbeat(worker) {
    worker.heartbeat = Date.now()
  }

  onWorkerExit(worker) {
    this.destroyExpirationTimer(worker)

    if (!worker.exitedAfterDisconnect && !worker.killReason) {
      logger.info(`[${worker.process.pid}] Worker exited`)

      this.relocatedWorker(worker)
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

WorkersBroker.Events = Events

module.exports = WorkersBroker



