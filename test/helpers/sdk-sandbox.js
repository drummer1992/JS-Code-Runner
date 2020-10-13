require('./global')

const Backendless = require('backendless')

const SERVER_URL = 'http://foo.bar'
const APP_ID = 'A98AF58F-1111-2222-3333-6A88FD113200'
const API_KEY = 'ACC8DAE2-1111-2222-3333-64439E5D3300'
const APP_PATH = `${SERVER_URL}/${APP_ID}/${API_KEY}`

const chr4 = () => Math.random().toString(16).slice(-4)
const chr8 = () => `${chr4()}${chr4()}`

const Utils = {
  uidShort: () => chr8(),

  uid: () => `${chr8()}${chr8()}${chr8()}${chr8()}`,

  objectId: () => `${chr8()}-${chr4()}-${chr4()}-${chr4()}-${chr8()}${chr4()}`.toUpperCase(),

  wait: milliseconds => {
    return new Promise(resolve => {
      setTimeout(resolve, milliseconds)
    })
  },

  timeout: milliseconds => {
    return new Promise((resolve, reject) => {
      setTimeout(() => reject(new Error('Timeout')), milliseconds)
    })
  },

  shouldNotBeCalledInTime(fn, timeout = 2000) {
    return Promise.race([fn(), Utils.timeout(timeout)])
      .catch(error => {
        if (error.message !== 'Timeout') {
          throw error
        }
      })
  }
}

let mockRequests = []

wrapRequest(Backendless.Request)

function wrapRequest(R) {
  const nativeRequestSend = R.send

  R.send = function fakeRequestSend(path, method, headers, body, encoding) {
    const mockRequest = mockRequests.shift()

    if (!mockRequest) {
      return nativeRequestSend.call(R, path, method, headers, body, encoding)
    }

    Object.assign(mockRequest, { path, method, headers, body, encoding })

    try {
      mockRequest.body = JSON.parse(body)
    } catch (e) {
      //
    }

    return Promise.resolve()
      .then(mockRequest.responseFn)
      .then(response => {
        const delay = response.delay

        delete response.delay

        return delay ? Utils.wait(delay).then(() => response) : response
      })
      .then(response => {
        return Object.assign({ status: 200, body: undefined, headers: {} }, response)
      })
  }
}

function prepareMockRequest(responseFn) {
  const mockRequest = {
    responseFn: typeof responseFn === 'function'
      ? responseFn
      : () => ({ body: responseFn })
  }

  mockRequests.push(mockRequest)

  return mockRequest
}

function initApp() {
  Backendless.initApp(APP_ID, API_KEY)
}

const createSandboxFor = each => context => {
  const beforeHook = each ? beforeEach : before

  if (context) {
    context.timeout(10000)
  }

  beforeEach(function() {
    mockRequests = []
  })

  beforeHook(() => {
    Backendless.serverURL = SERVER_URL
    Backendless.initApp(APP_ID, API_KEY)
  })
}

const forTest = createSandboxFor(true)
const forSuite = createSandboxFor(false)

module.exports = {
  SERVER_URL,
  APP_ID,
  API_KEY,
  APP_PATH,
  forTest,
  forSuite,
  prepareMockRequest,
  initApp,
  Backendless,
}



