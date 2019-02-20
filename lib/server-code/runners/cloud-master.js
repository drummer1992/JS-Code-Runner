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

module.exports = async function runMaster(opts) {
  logger.info('Starting Backendless Cloud Code Runner for JS')
  logger.info(`Backendless Repository Path is set to [${opts.backendless.repoPath}]`)

  const lowPriorityThreshold = opts.workers.lowPriorityThreshold
  const taskRequests = {}

  const messageBroker = new MessagesBroker(opts.backendless.msgBroker, lowPriorityThreshold ? 2 : 1)
  const workersBroker = new WorkersBroker(opts.workers, opts)

  messageBroker.on('error', exitOnError)
  messageBroker.on('reconnect', onReadyForNextTasks)

  workersBroker.on(WorkersBroker.Events.READY_FOR_NEXT_TASK, onReadyForNextTasks)
  workersBroker.on(WorkersBroker.Events.TASK_PROCESSED, onTaskProcessed)

  await messageBroker.init()
  await managementServer.start(opts.managementHttpPort, workersBroker)

  messageBroker.subscribe(SERVICE_QUEUE_P_CR_EVENT, message => {
    if (message.command === CLEANUP_CODE_ALL_COMMAND) {
      workersBroker.killAllAppWorkers(message.applicationId, 'New Business Logic for app has been deployed.')
    }
  })

  logger.info('Ready and waiting for Server Code tasks..')

  onReadyForNextTasks()

  function onReadyForNextTasks() {
    const currentWorkersLoad = workersBroker.getCurrentLoad()
    const availableWorkersCount = workersBroker.getAvailableWorkersCount()

    waitAndProcessNextTask(TASKS_CHANNEL)

    if (lowPriorityThreshold && lowPriorityThreshold > currentWorkersLoad && availableWorkersCount > 1) {
      /**
       * subscribe to LP Queue only if:
       *  - workers.lowPriorityThreshold is configured and value is more than zero
       *  - current workers load less than workers.lowPriorityThreshold
       *  - and there at least 2 available workers to process incoming tasks
       * **/
      waitAndProcessNextTask(TASKS_CHANNEL_LP)
    }
  }

  function waitAndProcessNextTask(tasksChannel) {
    if (!taskRequests[tasksChannel]) {
      taskRequests[tasksChannel] = Promise.resolve()
        .then(() => messageBroker.getTask(tasksChannel))
        .then(task => Object.assign(task, { cacheable: tasksExecutor.isTaskCacheable(task) }))
        .then(async task => {
          const worker = await workersBroker.getWorkerForTask(task.applicationId, task.cacheable)

          workersBroker.processTask(task, worker)
        })
        .then(() => taskRequests[tasksChannel] = null)
        .catch(() => taskRequests[tasksChannel] = null)
    }
  }

  function onTaskProcessed(task, result) {
    messageBroker.setTaskResult(task, result)
  }

  function exitOnError(error) {
    logger.error(error)

    process.exit(1)
  }
}