'use strict';

const cluster = require('cluster');

function buildMasterOptions(appRequired, repoPathRequired) {
  const program = require('commander');

  const getOptionsFromConfigurationFile = require('./file');
  const enrichWithDefaults = require('./defaults');
  const enrichWithConsul = require('./consul');
  const enrichWithENV = require('./env');
  const enrichWithProgramArguments = require('./program');

  return Promise
    .resolve(getOptionsFromConfigurationFile(program.config))
    .then(options => Promise.resolve()
      .then(() => enrichWithDefaults(options))
      .then(() => enrichWithConsul(options))
      .then(() => enrichWithENV(options))
      .then(() => enrichWithProgramArguments(options, appRequired, repoPathRequired))
      .then(() => options));
}

module.exports = function getRunOptions(appRequired, repoPathRequired) {
  const REQUEST_RUN_OPTIONS_PROCESS_EVENT = 'REQUEST_RUN_OPTIONS_PROCESS_EVENT';
  const RECEIVE_RUN_OPTIONS_PROCESS_EVENT = 'RECEIVE_RUN_OPTIONS_PROCESS_EVENT';

  if (cluster.isMaster) {
    return buildMasterOptions(appRequired, repoPathRequired)
      .then(options => {
        cluster.on('message', (worker, message) => {
          if (message.type === REQUEST_RUN_OPTIONS_PROCESS_EVENT) {
            worker.process.send({ type: RECEIVE_RUN_OPTIONS_PROCESS_EVENT, options });
          }
        });

        return options
      });
  }

  return new Promise(resolve => {
    process.on('message', onMessageFromMaster);
    process.send({ type: REQUEST_RUN_OPTIONS_PROCESS_EVENT });

    function onMessageFromMaster(message) {
      if (message.type === RECEIVE_RUN_OPTIONS_PROCESS_EVENT) {
        resolve(message.options);

        process.removeListener('message', onMessageFromMaster);
      }
    }
  });
};




