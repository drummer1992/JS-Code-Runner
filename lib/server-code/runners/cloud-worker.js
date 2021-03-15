'use strict'

setProcessTitle('IDLING')

const { promisifyNode } = require('../../util/promise')

const processSend = promisifyNode(process.send, process)

require('backendless').ServerCode = require('../../server-code/api')

const path = require('path')
const Backendless = require('backendless')

const logger = require('../../util/logger')
const tasksExecutor = require('./tasks/executor')

// it's important thing when we run the code-runner from somewhere outside the code-runner directory
const CODE_RUNNER_ABSOLUTE_PATH = path.resolve(__dirname, '../../../')

const RunOptions = JSON.parse(process.env.RUN_OPTIONS)
delete process.env.RUN_OPTIONS

logger.usePid = true
logger.useAppId = true
logger.useBackendlessLogging = true
logger.appAliases = RunOptions.backendless.appAliases || {}
logger.verbose = RunOptions.verbose

function setProcessTitle(label) {
  process.title = `Backendless JS CodeRunner - ${label || 'UNKNOWN'}`
}

const flushPendingLogs = async () => {
  if (Backendless.applicationId) {
    try {
      logger.debug('Flushing logs')

      await Backendless.Logging.flush()

      logger.debug('Flushed logs')
    } catch (error) {
      logger.error('Error during logs flushing', error.message || error)
    }
  }
}

/**
 * @param {CodeRunnerTask} task
 * @returns {void}
 */
const executeTask = async task => {
  try {
    const time = process.hrtime()

    const taskResult = await tasksExecutor.execute(task, RunOptions)

    const duration = process.hrtime(time)
    const ms = duration[0] * 1000 + duration[1] / 1e6

    logger.info(`Processing finished in ${ms.toFixed(3)}ms`)

    await processSend({ processed: true, taskResult })

    if (taskResult) {
      logger.debug('Task results sent')
    }

  } catch (error) {
    logger.error(`Error during task execution. ${error.message || error}`)
  }
}

const processTask = async task => {
  if (!RunOptions.appWorkingDir) {
    setProcessTitle(task.applicationId)

    const backendlessRepoPath = RunOptions.backendless.repoPath
    const appId = task.applicationId.toLowerCase()

    RunOptions.appWorkingDir = path.resolve(CODE_RUNNER_ABSOLUTE_PATH, backendlessRepoPath, appId)
  }

  await executeTask(task)
  await flushPendingLogs()

  await processSend('idling')
}

function handleTermination() {
  // need to prevent shutting down the worker once the master process is stopping
  // the worker process will be terminated with the "SIGKILL" signal from the master process
}

process.on('message', message => {
  if (message.task) {
    processTask(message.task)
  }
})

process.on('SIGINT', handleTermination)
process.on('SIGTERM', handleTermination)

setInterval(() => {
  processSend('heartbeat')
}, RunOptions.workers.heartbeat.interval * 1000)

processSend('started')
