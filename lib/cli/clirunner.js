'use strict';

const CodeRunner = require('../index');
const packageConfig = require(__dirname + '/../../package.json');
const program = require('commander');
const logger = require('../util/logger');

program
  .version(packageConfig.version)
  .option('-c, --config <path>', 'set config path. defaults to ./coderunner.json')
  .option('-a, --app-id <id>', 'Application Id')
  .option('-k, --app-key <key>', 'Application Secret Key')
  .option('-v, --app-version <version>', 'Application Version');

program
  .command('debug')
  .description('debug business logic')
  .action(function() {
    CodeRunner.debug(program);
  });

program
  .command('deploy')
  .description('deploy business logic to production')
  .action(function() {
    CodeRunner.deploy(program);
  });

program
  .command('cloud', null, {noHelp: true})
  .action(function() {
    CodeRunner.cloud(program);
  });

logger.info('CodeRunner(tm) Backendless Debugging Utility');
logger.info(`Copyright(C) ${new Date().getFullYear()} Backendless Corp. All rights reserved. `);
logger.info(`Version ${packageConfig.version}`);

program.parse(process.argv);

if (program.args.length === 0) {
  CodeRunner.debug(pickOptions(program));
}
