'use strict';

const CodeRunner    = require('../index'),
      program       = require('commander'),
      logger        = require('../util/logger'),
      terminal      = require('../util/terminal'),
      packageConfig = require(`${__dirname}/../../package.json`);

const getRunOptions = require('../options');

process.on('unhandledRejection', r => logger.error(r));

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

const startRunner = ({ appRequired, repoPathRequired, createRunner, showVersion, showCopyright, showModelConfirm }) => {

  showVersion && terminal.printVersion();
  showCopyright && terminal.printCopyright();

  const confirmModelIfNeeded = opts => {
    if (!showModelConfirm) {
      return opts;
    }

    return terminal.showModelAlert(opts.app.model).then(() => opts);
  };

  return Promise.resolve()
    .then(() => getRunOptions(isMaster, appRequired, repoPathRequired))
    .then(confirmModelIfNeeded)
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
  createRunner    : CodeRunner.deploy,
  appRequired     : true,
  showVersion     : true,
  showCopyright   : true,
  showModelConfirm: true
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
  .option('-k, --app-key <key>', 'Application CodeRunner API Key')
  .option('-s, --api-server <url>', 'Backendless API Server URL')
  .option('-m, --model <model>', 'Business Logic model')
  .option('-q, --quiet', 'Don\'t show the confirmation dialog before deploy to Business Logic model')
  .option('--msg-broker-host <host>', 'Message Broker Host')
  .option('--msg-broker-port <port>', 'Message Broker Port')
  .option('--repo-path <path>', 'Backendless Repo Path')
  .option('--keep-zip', 'Keep generated zip file after deploying')
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
  .action(deploy);

program
  .command('*', null, { noHelp: true })
  .action(() => program.help());

program.parse(process.argv);

if (!program.args.length) {
  debug();
}

function exit() {
  process.exit();
}

function exitWithError(err) {
  logger.error('Error:', (logger.verbose && err.stack) || err.message || err);

  process.exit();
}
