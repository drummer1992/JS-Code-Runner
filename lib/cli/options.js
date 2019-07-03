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
  const redisTls = options.backendless.msgBroker && options.backendless.msgBroker.tls

  if (!redisTls) {
    return
  }

  const fs = require('fs')

  if (redisTls.certFile) {
    redisTls.cert = fs.readFileSync(redisTls.certFile, 'utf8')
  }

  if (redisTls.keyFile) {
    redisTls.key = fs.readFileSync(redisTls.keyFile, 'utf8')
  }

  if (redisTls.caFile) {
    redisTls.ca = fs.readFileSync(redisTls.caFile, 'utf8')
  }
}



