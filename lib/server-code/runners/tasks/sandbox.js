'use strict'

const logger = require('../../../util/logger')

exports.processSetuid = process.setuid.bind(process)

let applied = false

exports.apply = applicationId => {
  if (applied) {
    return
  }

  process.send = getThrower('Calling process.send')
  process.kill = getThrower('Calling process.kill')

  const child_process = require('child_process')

  overrideModuleMethods('ChildProcess', child_process)

  child_process.ChildProcess = getThrower('Class ChildProcess')

  const appUid = applicationId.replace(/-/g, '').toLowerCase()

  try {
    process.setuid(appUid)
  } catch (e) {
    if (logger.verbose) {
      logger.error(e.message)
    }

    throw new Error('Internal error. Unable to run server code in sandbox.')
  }

  applied = true
}

function overrideModuleMethods(name, module) {
  Object.keys(module).forEach(method => {
    if (typeof module[method] === 'function') {
      module[method] = getThrower(`Calling ${name}.${method} method`)
    }
  })
}

function getThrower(initiator) {
  return function() {
    throw new Error(`${initiator} is not allowed inside Business Logic`)
  }
}