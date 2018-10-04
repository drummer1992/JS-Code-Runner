'use strict'

process.title = 'Backendless CodeRunner Helper for JS'

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

const flushPendingLogs = () => {
  if (Backendless.applicationId) {
    return Backendless.Logging.flush().catch(err => {
      logger.error('Error during logs flushing', err.message || err)
    })
  }
}

async function detectUnresolvedHandlers(getUnresolvedAsyncHandlers) {
  const unresolvedAsyncInitiatorPaths = getUnresolvedAsyncHandlers(RunOptions.appWorkingDir)

  if (unresolvedAsyncInitiatorPaths.aggregated.length) {
    logger.warn(
      'Some ASYNC functions were not resolved before task process was completely finished. \n' +
      'We recommend you resolve all the async handlers before return result. \n' +
      'Details: \n' +
      JSON.stringify(unresolvedAsyncInitiatorPaths.aggregated, null, 2) + '\n'
    )

    await flushPendingLogs()
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
    const backendlessRepoPath = RunOptions.backendless.repoPath
    const appId = task.applicationId.toLowerCase()

    RunOptions.appWorkingDir = path.resolve(CODE_RUNNER_ABSOLUTE_PATH, backendlessRepoPath, appId)
  }

  let getUnresolvedAsyncHandlers

  if (task.cacheable) {
    getUnresolvedAsyncHandlers = require('../../util/unresolved-async-handlers').getUnresolvedAsyncHandlers
  }

  try {
    await executeTask(task)

  } catch (error) {
    logger.error(error.message)
  }

  //must be before getting unresolved async handlers
  await flushPendingLogs()

  if (getUnresolvedAsyncHandlers) {
    await detectUnresolvedHandlers(getUnresolvedAsyncHandlers)
  }

  await processSend('idling')
}


process.on('message', message => {
  if (message.task) {
    processTask(message.task)
  }
})

setInterval(() => {
  processSend('heartbeat')
}, RunOptions.workers.heartbeat.interval * 1000)

processSend('started')