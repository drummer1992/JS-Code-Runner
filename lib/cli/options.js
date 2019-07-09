/* eslint no-console:0 */

'use strict'

module.exports = async function getRunOptions(appRequired, repoPathRequired) {
  const program = require('commander')

  const getOptionsFromConfigurationFile = require('./file')
  const enrichWithConsul = require('./consul')
  const enrichWithENV = require('./env')
  const enrichWithProgramArguments = require('./program')

  const options = await getOptionsFromConfigurationFile(program.config)

  await enrichWithConsul(options)
  await enrichWithENV(options)
  await enrichWithProgramArguments(options, appRequired, repoPathRequired)

  ensureApiUrl(options)

  ensureRedisTLS(options)

  return options
}

function ensureApiUrl(options) {
  options.backendless.apiUrl = process.env.APIURL || options.backendless.apiUrl
  options.backendless.apiUri = process.env.APIURI || options.backendless.apiUri

  if (!options.backendless.apiUrl) {
    const apiProtocol = process.env.APIPROTOCOL || options.backendless.apiProtocol || 'http'
    const apiHost = process.env.APIHOST || options.backendless.apiHost
    const apiPort = process.env.APIPORT || options.backendless.apiPort

    if (!apiHost) {
      throw new Error('options.backendless.apiUrl or options.backendless.apiHost is not specified!')
    }

    options.backendless.apiUrl = `${apiProtocol}://${apiHost}${apiPort ? `:${apiPort}` : ''}`
  }

  if (!options.backendless.apiUrl.startsWith('http:') && !options.backendless.apiUrl.startsWith('https:')) {
    options.backendless.apiUrl = `http://${options.backendless.apiUrl}`
  }

  if (options.backendless.apiUri) {
    options.backendless.apiUrl = options.backendless.apiUrl + options.backendless.apiUri
  }

  if (!options.backendless.apiUrl) {
    throw new Error(
      '"options.backendless.apiServer" options is not configured\n' +
      '   Specify full url to the api server via "apiUrl" ' +
      'or via url parts [apiProtocol, apiHost, apiPort, apiUri] options'
    )
  } else {
    delete options.backendless.apiProtocol
    delete options.backendless.apiHost
    delete options.backendless.apiPort
    delete options.backendless.apiUri
  }
}

function ensureRedisTLS(options) {
  const fs = require('fs')

  if (options.backendless.msgBroker.ssl) {
    options.backendless.msgBroker.tls = options.backendless.msgBroker.tls || {}
  } else {
    delete options.backendless.msgBroker.tls
  }

  delete options.backendless.msgBroker.ssl

  const redisTLS = options.backendless.msgBroker.tls

  if (redisTLS) {
    if (redisTLS.rejectUnauthorized === undefined) {
      redisTLS.rejectUnauthorized = false
    }

    if (redisTLS.certFile) {
      redisTLS.cert = fs.readFileSync(redisTLS.certFile, 'utf8')

      delete redisTLS.certFile
    }

    if (redisTLS.keyFile) {
      redisTLS.key = fs.readFileSync(redisTLS.keyFile, 'utf8')

      delete redisTLS.keyFile
    }

    if (redisTLS.caFile) {
      redisTLS.ca = fs.readFileSync(redisTLS.caFile, 'utf8')

      delete redisTLS.caFile
    }
  }
}



