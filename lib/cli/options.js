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

  return options
}




