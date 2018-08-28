'use strict'

process.title = 'Backendless CodeRunner Helper for JS'

const processExit = process.exit.bind(process)
const processSend = process.send.bind(process)

require('backendless').ServerCode = require('../../server-code/api')

const wtf = require('wtfnode')
const path = require('path')
const Backendless = require('backendless')

const logger = require('../../util/logger')
const tasksExecutor = require('./tasks/executor')

const CODE_RUNNER_ABSOLUTE_PATH = process.cwd()

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

const getNotResolvedAsyncInitiatorPaths = () => {
  const items = []

  wtf.setLogger('info', message => {
    if (message.indexOf(' @ ') !== -1) {
      const executorFilePath = message.split(' @ ')[1]

      const isCodeRunnerExecutor = executorFilePath.indexOf(CODE_RUNNER_ABSOLUTE_PATH) === 0

      if (!isCodeRunnerExecutor) {
        items.push(executorFilePath)
      }
    }
  })

  wtf.dump()
  wtf.resetLoggers()

  return items
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

    processSend({ processed: true, taskResult })

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

  try {
    await executeTask(task)

  } catch (error) {
    logger.error(error.message)
  }

  //must be before getting unresolved async handlers
  await flushPendingLogs()

  if (task.cacheable) {
    const notResolvedAsyncInitiatorPaths = getNotResolvedAsyncInitiatorPaths()

    if (!notResolvedAsyncInitiatorPaths.length) {
      processSend('idling')
    } else {
      logger.warn(
        'Some ASYNC functions were not resolved before task process was completely finished. Initiators: \n' +
        JSON.stringify(notResolvedAsyncInitiatorPaths, null, 2) + '\n' +
        'We recommend you resolve all the async handlers before return result ' +
        'otherwise the process can not be cached and used for the next executions. \n' +
        'Process will be stopped.'
      )

      //flush remains logs before terminate the process
      await flushPendingLogs()

      processExit(0)
    }
  } else {
    processExit(0)
  }
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