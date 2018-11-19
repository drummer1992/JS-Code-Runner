'use strict'

module.exports = function enrichWithENV(options) {
  const REPO_PATH = process.env.REPO_PATH
  const BL_MANAGEMENT_HTTP_PORT = process.env.BL_MANAGEMENT_HTTP_PORT

  options.backendless.apiServer = process.env.API_URL || options.backendless.apiServer
  options.backendless.apiHost = process.env.APIHOST || options.backendless.apiHost
  options.backendless.apiProtocol = process.env.APIPROTOCOL || options.backendless.apiProtocol
  options.backendless.apiPort = process.env.APIPORT || options.backendless.apiPort

  if (REPO_PATH) {
    options.backendless.repoPath = REPO_PATH
  }

  if (BL_MANAGEMENT_HTTP_PORT) {
    options.managementHttpPort = BL_MANAGEMENT_HTTP_PORT
  }
}
