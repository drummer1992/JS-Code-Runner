'use strict'

module.exports = function enrichWithENV(options) {
  options.backendless.apiUrl = process.env.APIURL || options.backendless.apiUrl || options.backendless.apiServer
  options.backendless.apiHost = process.env.APIHOST || options.backendless.apiHost
  options.backendless.apiProtocol = process.env.APIPROTOCOL || options.backendless.apiProtocol
  options.backendless.apiPort = process.env.APIPORT || options.backendless.apiPort
  options.backendless.apiUri = process.env.APIURI || options.backendless.apiUri
  options.backendless.repoPath = process.env.REPO_PATH || options.backendless.repoPath

  options.backendless.publicHost = process.env.PUBLIC_HOST || options.backendless.publicHost
  options.backendless.publicPort = process.env.PUBLIC_PORT || options.backendless.publicPort
  options.backendless.publicProtocol = process.env.PUBLIC_PROTOCOL || options.backendless.publicProtocol
  options.backendless.publicAPIUri = process.env.PUBLIC_API_URI || options.backendless.publicAPIUri

  options.backendless.public = {
    fileDownloadUrl: process.env.FILE_DOWNLOAD_URL || options.backendless.public.fileDownloadUrl,
    publicAPIUrl   : process.env.PUBLIC_API_URL || options.backendless.public.publicAPIUrl,
    internalAPIUrl : options.backendless.apiUrl || options.backendless.public.internalAPIUrl
  }

  options.compression = {
    debug: process.env.COMPRESSION_DEBUG || options.compression.debug,
    prod : process.env.COMPRESSION_PROD || options.compression.prod || options.compression.cloud
  }

  options.managementHttpPort = process.env.BL_MANAGEMENT_HTTP_PORT || options.managementHttpPort
}
