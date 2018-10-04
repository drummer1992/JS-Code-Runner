'use strict'

const dgramSocket = require('dgram').Socket
const HttpServer = require('http').Server
const HttpsServer = require('https').Server
const NetServer = require('net').Server
const NetSocket = require('net').Socket
const TlsServer = require('tls').Server

patchTimers()
patchPromise()
patchEventEmitter()

const timers = []
const timerHandlers = new WeakMap()

const promises = []
const promiseHandlers = new WeakMap()

function buildFnDescription(fn) {
  return {
    name : fn && fn.name || '(anonymous)',
    stack: getStack(),
  }
}

function getStack() {
  const nativeErrorStackTraceLimit = Error.stackTraceLimit
  const nativeErrorPrepareStackTrace = Error.prepareStackTrace

  const error = {}

  Error.stackTraceLimit = 50
  Error.prepareStackTrace = (_, stack) => stack

  Error.captureStackTrace(error)

  const stack = error.stack.map(function(item) {
    if (item.isEval()) {
      const matched = item.getEvalOrigin().match(/\((.*):(\d*):(\d*)\)/) || {}

      return {
        name: '<eval>',
        file: matched[1],
        line: matched[2]
      }
    }

    return {
      name  : item.getFunctionName(),
      file  : item.getFileName(),
      line  : item.getLineNumber(),
      column: item.getColumnNumber(),
    }
  })

  Error.stackTraceLimit = nativeErrorStackTraceLimit
  Error.prepareStackTrace = nativeErrorPrepareStackTrace

  return stack
}

function getTopCaller(rootDirectory, stack) {
  for (let i = 0; i < stack.length; i++) {
    const file = stack[i].file

    if (file && file.startsWith(rootDirectory)) {
      return stack[i]
    }
  }

  return null
}

function getCallerLocation(caller) {
  return (caller && caller.file)
    ? `${caller.file}:${caller.line}:${caller.column}`
    : null
}

function copyProperties(source, target) {
  Object.getOwnPropertyNames(source).forEach(function(key) {
    try {
      Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key))
    } catch (e) {
      // just ignore
    }
  })

  if (Object.getOwnPropertySymbols) {
    Object.getOwnPropertySymbols(source).forEach(function(sym) {
      try {
        Object.defineProperty(target, sym, Object.getOwnPropertyDescriptor(source, sym))
      } catch (e) {
        // just ignore
      }
    })
  }
}

function defineObjectProperties(obj, props) {
  const properties = {}

  Object.keys(props).forEach(key => {
    properties[key] = {
      enumerable  : false,
      configurable: false,
      writable    : false,
      value       : props[key]
    }
  })

  Object.defineProperties(obj, properties)
}

function proxyFunction(fn, callback) {
  if (!callback || typeof fn !== 'function' || fn.hasOwnProperty('__wrapped')) {
    return fn
  }

  const wrapped = function() {
    callback.apply(this, arguments)

    return fn.apply(this, arguments)
  }

  defineObjectProperties(fn, {
    __wrapped: true,
  })

  copyProperties(fn, wrapped)

  return wrapped
}

function patchTimers() {
  function wrapTimer(type) {
    const setterName = `set${type}`
    const cleanerName = `clear${type}`

    const nativeSetter = global[setterName]
    const nativeCleaner = global[cleanerName]

    function onTimerDone(timer) {
      const timerIndex = timers.indexOf(timer)

      if (timerIndex >= 0) {
        timers.splice(timerIndex, 1)

        if (timerHandlers.has(timer)) {
          timerHandlers.delete(timer)
        }
      }
    }

    global[setterName] = function() {
      arguments[0] = proxyFunction(arguments[0], () => onTimerDone(timer))

      const timer = nativeSetter.apply(this, arguments)

      timers.push(timer)

      timerHandlers.set(timer, Object.assign({ type }, buildFnDescription(arguments[0])))

      return timer
    }

    global[cleanerName] = function(timer) {
      onTimerDone(timer)

      return nativeCleaner.apply(this, arguments)
    }

    copyProperties(nativeSetter, global[setterName])
    copyProperties(nativeCleaner, global[cleanerName])
  }

  wrapTimer('Timeout')
  wrapTimer('Interval')
  wrapTimer('Immediate')
}

function patchPromise() {
  const nativePromiseThen = Promise.prototype.then

  // patch "then" method for keeping all the unresolved promises
  // don't need to patch "catch" method because
  // the "catch" method will call the "then" method with only one "onRejected" callback
  Promise.prototype.then = function(onFulfilled, onRejected) {
    if (!promises.includes(this)) {
      promises.push(this)

      promiseHandlers.set(this, [])
    }

    const handlers = promiseHandlers.get(this)

    const onDone = () => {
      const promiseIndex = promises.indexOf(this)

      if (promiseIndex >= 0) {
        promises.splice(promiseIndex, 1)

        if (promiseHandlers.has(this)) {
          promiseHandlers.delete(this)
        }
      }
    }

    const args = []

    if (onFulfilled) {
      args[0] = proxyFunction(onFulfilled, onDone)

      handlers.push(buildFnDescription(onFulfilled))
    } else {
      // in case if onFulfilled callback was not be passed, for example if has been called "catch" method
      // just call onDone for marking other callbacks as resolved
      args[0] = onDone
    }

    if (onRejected) {
      args[1] = proxyFunction(onRejected, onDone)

      handlers.push(buildFnDescription(onRejected))

    } else {
      // in case if onRejected callback was not be passed,
      // just catch error and call onDone for marking other callbacks as resolved
      // and throw error back
      args[1] = error => {
        onDone()

        throw error
      }
    }

    return nativePromiseThen.apply(this, args)
  }
}

function patchEventEmitter() {
  const EventEmitter = require('events').EventEmitter
  const _EventEmitter_addListener = EventEmitter.prototype.addListener

  EventEmitter.prototype.on = EventEmitter.prototype.addListener = function(...args) {
    const fn = args[1]

    if (typeof fn === 'function') {
      args[1] = proxyFunction(fn)

      args[1].listener = fn

      if (!fn.hasOwnProperty('__callSite')) {
        defineObjectProperties(fn, {
          __callSite: buildFnDescription(fn)
        })
      }
    }

    return _EventEmitter_addListener.apply(this, args)
  }

  EventEmitter.prototype.once = function(...args) {
    const type = args[0]
    const fn = args[1]

    if (typeof fn === 'function') {
      args[1] = proxyFunction(fn, () => {
        this.removeListener(type, fn)
      })

      args[1].listener = args[1]

      if (!fn.hasOwnProperty('__callSite')) {
        defineObjectProperties(fn, {
          __callSite: buildFnDescription(fn)
        })
      }
    }

    return _EventEmitter_addListener.apply(this, args)
  }
}

function getUnresolvedTimers(rootDirectory) {
  const list = []
  const map = {}

  timers.forEach(timer => {
    const handler = timerHandlers.get(timer)

    if (handler) {
      const caller = getTopCaller(rootDirectory, handler.stack)
      const location = getCallerLocation(caller)

      if (location && !map[location]) {
        list.push(Object.assign({}, handler, { location, name: caller.name || handler.name }))
        map[location] = handler
      }
    }
  })

  return list
}

function getUnresolvedPromises(rootDirectory) {
  const list = []
  const map = {}

  promises.forEach(promise => {
    const handlers = promiseHandlers.get(promise) || []

    handlers.forEach(handler => {
      const caller = getTopCaller(rootDirectory, handler.stack)
      const location = getCallerLocation(caller)

      if (location && !map[location]) {
        list.push(Object.assign({}, handler, { location, name: caller.name || handler.name }))
        map[location] = handler
      }
    })
  })

  return list
}

function getUnresolvedServerHandlers(rootDirectory, activeServerHandlers) {
  const result = []

  activeServerHandlers.forEach(function(s) {
    const handler = {
      type: 'unknown type'
    }

    result.push(handler)

    if (s instanceof HttpServer) {
      handler.type = 'HTTP'
    } else if (s instanceof HttpsServer) {
      handler.type = 'HTTPS'
    } else if (s instanceof TlsServer) {
      handler.type = 'TLS'
    } else if (s instanceof NetServer) {
      handler.type = 'TCP'
    } else if (s instanceof dgramSocket) {
      handler.type = 'UDP'
    }

    try {
      const address = s.address()

      handler.port = address.port

    } catch (e) {
      if (handler.type === 'UDP') {
        return
      }

      throw e
    }

    let eventType

    if (handler.type === 'HTTP' || handler.type === 'HTTPS') {
      eventType = 'request'
    } else if (handler.type === 'UDP') {
      eventType = 'message'
    } else {
      eventType = 'connection'
    }

    const listeners = s.listeners(eventType) || []

    listeners.forEach(fn => {
      if (fn.__callSite) {
        const caller = getTopCaller(rootDirectory, fn.__callSite.stack)

        if (caller && caller.file) {
          Object.assign(handler, caller)
        }
      }
    })
  })

  return result
}

function getUnresolvedSocketHandlers(rootDirectory, activeSocketHandlers) {
  const result = []

  activeSocketHandlers.forEach(socket => {
    const handler = {}

    if (socket.localAddress) {
      const { localAddress, localPort, remoteAddress, remotePort } = socket

      Object.assign(handler, { localAddress, localPort, remoteAddress, remotePort })

      result.push(handler)
    }

    const connectListeners = socket.listeners('connect') || []

    connectListeners.forEach(fn => {
      if (fn.__callSite) {
        const caller = getTopCaller(rootDirectory, fn.__callSite.stack)

        if (caller && caller.file) {
          Object.assign(handler, caller)
        }
      }
    })
  })

  return result
}

function aggregateUnresolvedHandlers(result) {
  const locations = []

  const handlers = [].concat(
    result.promises,
    result.timers,
  )

  handlers.forEach(handler => {
    if (handler.location && !locations.includes(handler.location)) {
      locations.push(handler.location)
    }
  })

  return locations
}

function getUnresolvedAsyncHandlers(rootDirectory) {
  const activeHandlers = {
    sockets: [],
    servers: [],
  }

  process._getActiveHandles().forEach(function(handler) {
    if (handler instanceof NetSocket && !handler.fd) {
      activeHandlers.sockets.push(handler)
    } else if (handler instanceof NetServer || handler instanceof dgramSocket) {
      activeHandlers.servers.push(handler)
    }
  })

  const result = {
    timers   : getUnresolvedTimers(rootDirectory),
    promises : getUnresolvedPromises(rootDirectory),
    servers  : getUnresolvedServerHandlers(rootDirectory, activeHandlers.servers),
    sockets  : getUnresolvedSocketHandlers(rootDirectory, activeHandlers.sockets),
  }

  result.aggregated = aggregateUnresolvedHandlers(result)

  return result
}

module.exports = {
  getUnresolvedAsyncHandlers: getUnresolvedAsyncHandlers,
}