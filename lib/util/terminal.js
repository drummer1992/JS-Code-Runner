'use strict';

const program = require('commander');
const logger = require('../util/logger');
const async = require('../util/async');
const packageConfig = require(`${__dirname}/../../package.json`);

const modelWarningMsg = modelName => `IMPORTANT!
The business logic code will be deployed to model "${ modelName }".
Any business logic which is already deployed on the server in that model
will be removed and replaced with the code from your current project.`;

const modelConfirmMsg = `If this is an undesired behavior, stop now and set a different deployment model
either by using the --model argument or changing the model name in coderunner.json.
Would you like to continue? (Y/N)`;

const showModelAlert = async(function* (modelName) {
  logger.info(modelWarningMsg(modelName));

  if (program.quiet) {
    return;
  }

  const confirmed = (yield confirmation(modelConfirmMsg));

  if (confirmed === false) {
    process.exit();
  }

  if (confirmed === undefined) {
    return showModelAlert(modelName);
  }
});

function printVersion() {
  logger.info(`CodeRunner(tm) Backendless JavaScript CodeRunner v${packageConfig.version}`);
}

function printCopyright() {
  logger.info(`Copyright(C) ${new Date().getFullYear()} Backendless Corp. All rights reserved. `);
}

function prompt(message) {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(message, (value) => {
      rl.close();
      resolve(value);
    });
  });
}

function promptParam(name) {
  return prompt(`Please enter ${ name } and press [Enter]:`);
}

function confirmation(msg) {
  return prompt(msg).then((answer = '') => {
    answer = answer.toUpperCase();

    if (answer === 'Y' || answer === 'YES') {
      return true;
    }

    if (answer === 'N' || answer === 'NO') {
      return false;
    }
  });
}

exports.printVersion = printVersion;
exports.printCopyright = printCopyright;
exports.showModelAlert = showModelAlert;
exports.prompt = prompt;
exports.promptParam = promptParam;
exports.confirmation = confirmation;