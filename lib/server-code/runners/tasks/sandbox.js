'use strict'

exports.processSetuid = process.setuid.bind(process)

exports.apply = () => {
  process.send = getThrower('Calling process.send')
  process.kill = getThrower('Calling process.kill')

  const child_process = require('child_process')

  overrideModuleMethods('ChildProcess', child_process)

  child_process.ChildProcess = getThrower('Class ChildProcess')
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