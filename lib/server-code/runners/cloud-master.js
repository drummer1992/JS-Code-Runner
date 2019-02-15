'use strict'

const logger = require('../../util/logger')
const MessagesBroker = require('../services/messages-broker')
const WorkersBroker = require('./cloud-workers-broker')
const managementServer = require('../services/management-server')
const tasksExecutor = require('./tasks/executor')

const TASKS_CHANNEL = 'CODE_RUNNER_DRIVER'
const TASKS_CHANNEL_LP = 'JS_CR_QUEUE_LP'

const SERVICE_QUEUE_P_CR_EVENT = 'SERVICE_QUEUE_P_CR'
const CLEANUP_CODE_ALL_COMMAND = 'cleanup_code_all'

module.exports = async function(opts) {
  logger.info('Starting Backendless Cloud Code Runner for JS')
  logger.info(`Backendless Repository Path is set to [${opts.backendless.repoPath}]`)

  let lockProcessing = false
  let lowPriorityTaskRequest = null

  const lowPriorityThreshold = opts.workers.lowPriorityThreshold

  const pendingTasks = []

  const messageBroker = new MessagesBroker(opts.backendless.msgBroker, lowPriorityThreshold ? 2 : 1)
  const workersBroker = new WorkersBroker(opts.workers, opts)

  messageBroker.on('error', exitOnError)
  messageBroker.on('reconnect', onWorkersBrokerReconnect)

  workersBroker.on(WorkersBroker.Events.READY_FOR_NEXT_TASK, onReadyForNextTask)
  workersBroker.on(WorkersBroker.Events.TASK_PROCESSED, onTaskProcessed)

  await messageBroker.init()
  await managementServer.start(opts.managementHttpPort, workersBroker)

  messageBroker.subscribe(SERVICE_QUEUE_P_CR_EVENT, message => {
    if (message.command === CLEANUP_CODE_ALL_COMMAND) {
      workersBroker.killAllAppWorkers(message.applicationId, 'New Business Logic for app has been deployed.')
    }
  })

  logger.info('Ready and waiting for Server Code tasks..')

  onReadyForNextTask()

  function onWorkersBrokerReconnect() {
    lockProcessing = false

    onReadyForNextTask()
  }

  async function onReadyForNextTask() {
    //lock until a task and a worker aren't ready for processing
    if (!lockProcessing) {
      lockProcessing = true

      const task = await getTask()

      task.cacheable = tasksExecutor.isTaskCacheable(task)

      const worker = await workersBroker.getWorkerForTask(task.applicationId, task.cacheable)

      lockProcessing = false

      workersBroker.processTask(task, worker)
    }
  }

  async function getTask() {
    if (!lowPriorityThreshold) {
      return messageBroker.getTask(TASKS_CHANNEL)
    }

    if (pendingTasks.length) {
      return pendingTasks.pop()
    }

    const currentWorkersLoad = workersBroker.getCurrentLoad()
    const highPriorityTaskRequest = messageBroker.getTask(TASKS_CHANNEL)

    highPriorityTaskRequest.then(task => pendingTasks.push(task))

    if (!lowPriorityTaskRequest && currentWorkersLoad < lowPriorityThreshold) {
      lowPriorityTaskRequest = messageBroker.getTask(TASKS_CHANNEL_LP)
      lowPriorityTaskRequest.then(task => pendingTasks.push(task))
      lowPriorityTaskRequest.then(() => lowPriorityTaskRequest = null)
    }

    const task = await Promise.race([highPriorityTaskRequest, lowPriorityTaskRequest])

    if (pendingTasks.includes(task)) {
      pendingTasks.splice(pendingTasks.indexOf(task), 1)
    }

    return task
  }

  function onTaskProcessed(task, result) {
    messageBroker.setTaskResult(task, result)
  }

  function exitOnError(error) {
    logger.error(error)

    process.exit(1)
  }
}