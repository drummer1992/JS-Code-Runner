'use strict';

const CodeRunner    = require('../index'),
      config        = require('../config'),
      program       = require('commander'),
      logger        = require('../util/logger'),
      file          = require('../util/file'),
      packageConfig = require(__dirname + '/../../package.json');

logger.info('CodeRunner(tm) Backendless Debugging Utility');
logger.info(`Copyright(C) ${new Date().getFullYear()} Backendless Corp. All rights reserved. `);
logger.info(`Version ${packageConfig.version}`);

function debug() {
  CodeRunner.debug(squeezeOptions(true));
}

function deploy() {
  CodeRunner.deploy(squeezeOptions());
}

function cloud() {
  CodeRunner.cloud(squeezeOptions(true));
}

program
  .version(packageConfig.version)
  .option('-c, --config <path>', 'set config path. defaults to ./coderunner.json')
  .option('-a, --app-id <id>', 'Application Id')
  .option('-k, --app-key <key>', 'Application Secret Key')
  .option('-v, --app-version <version>', 'Application Version')
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

if (program.args.length === 0) {
  debug();
}

function squeezeOptions(expandAppFiles) {
  const options = config.read(program.config);

  options.driverUrl = program.driverUrl;
  options.driverRequestId = program.driverRequestId;
  options.driverRunnerId = program.driverRunnerId;
  options.verboseMode = logger.verbose(program.verbose);

  options.app || (options.app = {});
  options.app.id = program.appId || options.app.id; //TODO: yield user prompted value
  options.app.secretKey = program.appKey || options.app.secretKey; //TODO: yield user prompted value
  options.app.version = program.appVersion || options.app.version; //TODO: yield user prompted value

  if (expandAppFiles) {
    options.app.files = file.expand(options.app.files, {nodir: true});
  }

  return options;
}

