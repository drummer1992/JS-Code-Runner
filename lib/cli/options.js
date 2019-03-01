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

  ensureApiServer(options)

  return options
}

function ensureApiServer(options) {
  const { apiServer, apiHost, apiProtocol, apiPort } = options.backendless

  if (!apiServer && apiHost) {
    options.backendless.apiServer = `${apiProtocol || 'http'}://${apiHost}${apiPort ? `:${apiPort}` : ''}`
  }

  if (!options.backendless.apiServer) {
    throw new Error(
      '"options.backendless.apiServer" options is not configured\n' +
      '   Specify full url to the api server via "apiServer" or via url parts [apiProtocol, apiHost, apiPort] options'
    )
  }
}




