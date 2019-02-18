'use strict'

module.exports = function enrichWithENV(options) {
  options.backendless.apiUrl = process.env.APIURL || options.backendless.apiUrl || options.backendless.apiServer
  options.backendless.apiHost = process.env.APIHOST || options.backendless.apiHost
  options.backendless.apiProtocol = process.env.APIPROTOCOL || options.backendless.apiProtocol
  options.backendless.apiPort = process.env.APIPORT || options.backendless.apiPort
  options.backendless.apiUri = process.env.APIURI || options.backendless.apiUri
  options.backendless.repoPath = process.env.REPO_PATH || options.backendless.repoPath

  options.managementHttpPort = process.env.BL_MANAGEMENT_HTTP_PORT || options.managementHttpPort
}
