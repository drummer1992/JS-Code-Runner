'use strict';

const CodeRunner    = require('../index'),
      config        = require('../config'),
      program       = require('commander'),
      logger        = require('../util/logger'),
      async         = require('../util/async'),
      packageConfig = require(`${__dirname}/../../package.json`);

const UUID_PATTERN = '[A-F0-9\\-]{36}';
const DEFAULT_REPO_PATH = '/var/lib/backendless/repo/';

const isMaster = require('cluster').isMaster;

const setTerminationHook = runner => {
  function handleTermination() {
    logger.info('Termination signal received. Shutting down..');

    Promise.resolve()
      .then(() => runner && runner.stop && runner.stop())
      .then(exit, exitWithError);
  }

  process.on('SIGINT', handleTermination);
  process.on('SIGTERM', handleTermination);

  return runner;
};

const startRunner = ({ appRequired, repoPathRequired, createRunner, showVersion, showCopyright }) => {

  showVersion && printVersion();
  showCopyright && printCopyright();

  return Promise.resolve()
    .then(() => buildOptions(appRequired, repoPathRequired))
    .then(createRunner)
    .then(setTerminationHook)
    .then(runner => runner.start())
    .catch(exitWithError);
};

const debug = () => startRunner({
  createRunner : CodeRunner.debug,
  appRequired  : true,
  showVersion  : true,
  showCopyright: true
});

const pro = () => startRunner({
  createRunner    : CodeRunner.pro,
  repoPathRequired: true,
  showVersion     : isMaster
});

const cloud = () => startRunner({
  createRunner    : CodeRunner.cloud,
  repoPathRequired: true,
  showVersion     : isMaster
});

const deploy = () => startRunner({
  createRunner: CodeRunner.deploy,
  appRequired: true,
  showVersion  : true,
  showCopyright: true
});


if (require('cluster').isMaster) {
  process.title = 'Backendless CodeRunner for JS';
} else {
  process.title = 'Backendless CodeRunner Helper for JS';
}

program
  .version(packageConfig.version)
  .option('-c, --config <path>', 'set config path. defaults to ./coderunner.json')
  .option('-a, --app-id <id>', 'Application Id')
  .option('-k, --app-key <key>', 'Application API Key')
  .option('-s, --api-server <url>', 'Backendless API Server URL')
  .option('--msg-broker-host <host>', 'Message Broker Host')
  .option('--msg-broker-port <port>', 'Message Broker Port')
  .option('--repo-path <path>', 'Backendless Repo Path')
  .option('--verbose', 'Verbose mode. More information output.');

program
  .command('debug')
  .description('debug business logic')
  .action(debug);

program
  .command('pro')
  .description('Pro CodeRunner')
  .action(pro);

program
  .command('cloud', null, { noHelp: true })
  .description('Cloud CodeRunner')
  .action(cloud);

program
  .command('deploy')
  .description('deploy business logic to production')
  .option('--keep-zip', 'Keep generated zip file after deploying')
  .action(deploy);

program
  .command('*', null, { noHelp: true })
  .action(() => program.help());

program.parse(process.argv);

if (!program.args.length) {
  debug();
}

function printVersion() {
  logger.info(`CodeRunner(tm) Backendless JavaScript CodeRunner v${packageConfig.version}`);
}

function printCopyright() {
  logger.info(`Copyright(C) ${new Date().getFullYear()} Backendless Corp. All rights reserved. `);
}

function exit() {
  process.exit();
}

function exitWithError(err) {
  logger.error('Error:', (logger.verbose && err.stack) || err.message || err);

  process.exit();
}

function assertValueIsUUID(value, name) {
  if (!value || !value.match(UUID_PATTERN)) {
    throw new Error(`${name} is invalid`);
  }
}

function assertRepoPathExists(repoPath) {
  if (!require('fs').existsSync(repoPath)) {
    throw new Error(`[repoPath] parameter points to not existing folder: [${repoPath}]`);
  }
}

function buildOptions(appIsRequired, repoPathIsRequired) {
  const opts = config.read(program.config);

  opts.backendless = opts.backendless || {};
  opts.backendless.apiServer = program.apiServer || opts.backendless.apiServer;
  opts.backendless.msgBroker = opts.backendless.msgBroker || {};
  opts.backendless.msgBroker.host = program.msgBrokerHost || opts.backendless.msgBroker.host;
  opts.backendless.msgBroker.port = program.msgBrokerPort || opts.backendless.msgBroker.port;
  opts.backendless.repoPath = program.repoPath || opts.backendless.repoPath || DEFAULT_REPO_PATH;
  opts.keepZip = program.keepZip || opts.keepSize;
  opts.verbose = logger.verbose = program.verbose || opts.verbose;

  if (opts.sandbox && !process.setuid) {
    throw new Error('Sandbox for ServerCode is available only on POSIX platforms');
  }

  if (appIsRequired) {
    opts.app = opts.app || {};

    const gatherAppOptions = async(function*() {
      opts.app.id = program.appId || opts.app.id || (yield prompt('Application ID'));
      opts.app.apiKey = program.appKey || opts.app.apiKey || opts.app.secretKey || (yield prompt('API Key'));
    });

    return gatherAppOptions()
      .then(() => {
        assertValueIsUUID(opts.app.id, 'Application ID');
        assertValueIsUUID(opts.app.apiKey, 'CodeRunner API Key');

        return opts;
      });
  }

  if (repoPathIsRequired) {
    assertRepoPathExists(opts.backendless.repoPath);
  }

  return Promise.resolve(opts);
}

function prompt(param) {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(`Please enter ${param} and press [Enter]:`, (value) => {
      rl.close();
      resolve(value);
    });
  });
}
