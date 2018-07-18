'use strict';

const child_process = require('child_process')

overrideModuleMethods('ChildProcess', child_process)

child_process.ChildProcess = getThrower('Class ChildProcess')

function overrideModuleMethods(name, module) {
  Object.keys(module).forEach(method => {
    if (typeof module[method] === 'function') {
      child_process[method] = getThrower(`Calling ${name}.${method} method`)
    }
  })
}

function getThrower(initiator) {
  return function() {
    throw new Error(`${initiator} is not allowed inside Business Logic`)
  }
}