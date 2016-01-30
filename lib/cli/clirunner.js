'use strict';

const CodeRunner    = require('../index'),
      config        = require('../config'),
      program       = require('commander'),
      logger        = require('../util/logger'),
      file          = require('../util/file'),
      async         = require('../util/async'),
      packageConfig = require(__dirname + '/../../package.json');

const UUID_PATTERN = '[A-F0-9\\-]{36}';

logger.info('CodeRunner(tm) Backendless Debugging Utility');
logger.info(`Copyright(C) ${new Date().getFullYear()} Backendless Corp. All rights reserved. `);
logger.info(`Version ${packageConfig.version}`);

function showError(err) {
  logger.error(err.message || err);
}

function debug() {
  squeezeOptions(true)
    .then(CodeRunner.debug)
    .catch(showError);
}

function cloud() {
  squeezeOptions(true)
    .then(CodeRunner.cloud)
    .catch(showError);
}

function deploy() {
  squeezeOptions()
    .then(CodeRunner.deploy)
    .catch(showError);
}

program
  .version(packageConfig.version)
  .option('-c, --config <path>', 'set config path. defaults to ./coderunner.json')
  .option('-a, --app-id <id>', 'Application Id')
  .option('-k, --app-key <key>', 'Application Secret Key')
  .option('-v, --app-version <version>', 'Application Version')
  .option('-s, --api-server <url>', 'Backendless API Server URL')
  .option('--verbose', 'Verbose mode. More information output.');

program
  .command('debug')
  .description('debug business logic')
  .action(debug);

program
  .command('deploy')
  .description('deploy business logic to production')
  .action(deploy);

program
  .command('cloud', null, {noHelp: true})
  .option('--driver-request-id', 'Request ID')
  .option('--driver-runner-id', 'CodeRunner ID')
  .option('--driver-url', 'CodeRunner Driver HTTP Server URL')
  .action(cloud);

program
  .command('*', null, {noHelp: true})
  .action(() => program.help());

program.parse(process.argv);

if (!program.args.length) {
  debug();
}

function assertValueIsUUID(value, name) {
  if (!value || !value.match(UUID_PATTERN)) {
    throw new Error(`${name} is invalid`);
  }
}

function squeezeOptions(expandAppFiles) {
  const options = config.read(program.config);

  options.backendless = options.backendless || {};
  options.backendless.apiServer = program.apiServer || options.backendless.apiServer;
  options.verboseMode = logger.verbose(program.verbose);

  options.driverUrl = program.driverUrl;
  options.driverRequestId = program.driverRequestId;
  options.driverRunnerId = program.driverRunnerId;

  let gatherAppOptions = async(function* () {
    options.app || (options.app = {});
    options.app.id = program.appId || options.app.id || (yield askUser('Application ID'));
    options.app.version = program.appVersion || options.app.version || (yield askUser('Application Version'));
    options.app.secretKey = program.appKey || options.app.secretKey || (yield askUser('Secret Key'));
    options.app.files = options.app.files || (yield askUser('a path to your business logic files folder'));
  });

  return gatherAppOptions()
    .then(() => {
      assertValueIsUUID(options.app.id, 'Application ID');
      assertValueIsUUID(options.app.secretKey, 'Secret Key');

      if (expandAppFiles) {
        options.app.files = file.expand(options.app.files, {nodir: true});
      }

      return options;
    });
}

function askUser(param) {
  const rl = require('readline').createInterface({input: process.stdin, output: process.stdout});

  return new Promise((resolve)=> {
    rl.question(`Please enter ${param} and press [Enter]:`, (value)=> {
      rl.close();
      resolve(value);
    })
  });
}
