'use strict';

const path = require('path');

const MASTER_OPTIONS_FILE_PATH = path.resolve(__dirname, './master.json');

function buildMasterOptions(appRequired, repoPathRequired) {
  const program = require('commander');

  const getOptionsFromConfigurationFile = require('./file');
  const enrichWithConsul = require('./consul');
  const enrichWithENV = require('./env');
  const enrichWithProgramArguments = require('./program');

  return Promise
    .resolve(getOptionsFromConfigurationFile(program.config))
    .then(options => Promise.resolve()
      .then(() => enrichWithConsul(options))
      .then(() => enrichWithENV(options))
      .then(() => enrichWithProgramArguments(options, appRequired, repoPathRequired))
      .then(() => options));
}

function saveMasterOptionsToFile(options) {
  const fs = require('fs');

  return new Promise((resolve, reject) => {
    fs.writeFile(MASTER_OPTIONS_FILE_PATH, JSON.stringify(options, null, 2), { flag: 'w' }, error => {
      if (error) {
        reject(error);
      } else {
        resolve(options);
      }
    });
  });
}

module.exports = function getRunOptions(isMaster, appRequired, repoPathRequired) {
  if (isMaster) {
    return buildMasterOptions(appRequired, repoPathRequired)
      .then(options => saveMasterOptionsToFile(options));
  }

  return require(MASTER_OPTIONS_FILE_PATH);
};




