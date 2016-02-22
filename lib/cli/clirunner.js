'use strict';

const CodeRunner    = require('../index'),
      config        = require('../config'),
      program       = require('commander'),
      logger        = require('../util/logger'),
      async         = require('../util/async'),
      packageConfig = require(__dirname + '/../../package.json');

const UUID_PATTERN = '[A-F0-9\\-]{36}';

logger.info('CodeRunner(tm) Backendless Debugging Utility');
logger.info(`Copyright(C) ${new Date().getFullYear()} Backendless Corp. All rights reserved. `);
logger.info(`Version ${packageConfig.version}`);

process.title = 'Backendless CodeRunner';

program
  .version(packageConfig.version)
  .option('-c, --config <path>', 'set config path. defaults to ./coderunner.json')
  .option('-a, --app-id <id>', 'Application Id')
  .option('-k, --app-key <key>', 'Application Secret Key')
  .option('-v, --app-version <version>', 'Application Version')
  .option('-s, --api-server <url>', 'Backendless API Server URL')
  .option('--msg-broker-host <host>', 'Message Broker Host')
  .option('--msg-broker-port <port>', 'Message Broker Port')
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
  .option('--driver-request-id <requestId>', 'Request ID')
  .option('--driver-runner-id <runnerId>', 'CodeRunner ID')
  .option('--driver-url  <driverUrl>', 'CodeRunner Driver URL')
  .option('--repo-path <path>', 'Repo path', '../repo/')
  .action(cloud);

program
  .command('*', null, {noHelp: true})
  .action(() => program.help());

program.on('verbose', function() {
  logger.verbose(program.verbose);
});

program.parse(process.argv);

if (!program.args.length) {
  debug();
}

function debug() {
  buildOptions(true)
    .then(CodeRunner.debug)
    .catch(showError);
}

function cloud() {
  buildOptions()
    .then((opts) => {

      opts.driverUrl = this.driverUrl;
      opts.driverRequestId = this.driverRequestId;
      opts.driverRunnerId = this.driverRunnerId;
      opts.backendless.repoPath = this.repoPath || opts.backendless.repoPath;

      if (!opts.driverUrl) throw 'error: missing required parameter [driver-url]';
      if (!opts.driverRequestId) throw 'error: missing required parameter [driver-request-id]';
      if (!opts.driverRunnerId) throw 'error: missing required parameter [driver-runner-id]';

      return CodeRunner.cloud(opts);
    })
    .catch(showError);
}

function deploy() {
  buildOptions(true)
    .then(CodeRunner.deploy)
    .catch(showError);
}

function showError(err) {
  logger.error(err.message || err);
}

function assertValueIsUUID(value, name) {
  if (!value || !value.match(UUID_PATTERN)) {
    throw new Error(`${name} is invalid`);
  }
}

function buildOptions(appIsRequired) {
  const opts = config.read(program.config);

  opts.backendless = opts.backendless || {};
  opts.backendless.apiServer = program.apiServer || opts.backendless.apiServer;
  opts.backendless.msgBroker = opts.backendless.msgBroker || {};
  opts.backendless.msgBroker.host = program.msgBrokerHost || opts.backendless.msgBroker.host;
  opts.backendless.msgBroker.port = program.msgBrokerPort || opts.backendless.msgBroker.port;

  if (appIsRequired) {
    opts.app || (opts.app = {});

    let gatherAppOptions = async(function* () {
      opts.app.id = program.appId || opts.app.id || (yield prompt('Application ID'));
      opts.app.version = program.appVersion || opts.app.version || (yield prompt('Application Version'));
      opts.app.secretKey = program.appKey || opts.app.secretKey || (yield prompt('Secret Key'));
      opts.app.files = opts.app.files || (yield prompt('a path to your business logic files folder'));
    });

    return gatherAppOptions()
      .then(() => {
        assertValueIsUUID(opts.app.id, 'Application ID');
        assertValueIsUUID(opts.app.secretKey, 'Secret Key');

        return opts;
      });
  }

  return Promise.resolve(opts);
}

function prompt(param) {
  const rl = require('readline').createInterface({input: process.stdin, output: process.stdout});

  return new Promise((resolve)=> {
    rl.question(`Please enter ${param} and press [Enter]:`, (value)=> {
      rl.close();
      resolve(value);
    })
  });
}
