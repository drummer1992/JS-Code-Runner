'use strict';

const buildModel        = require('./model').build,
      logger            = require('../util/logger'),
      path              = require('path'),
      fs                = require('fs'),
      file              = require('../util/file'),
      JSZip             = require('jszip'),
      ApiServerService = require('./services/api-server');

const APP_SIZE_LIMIT_REACHED = 'You have reached your limit';

exports.publish = function(opts) {
  const model = buildModel(process.cwd(), opts.app.files);
  const zipped = generateZip(model, opts.app.files.concat(dependencyPatterns()));
  const apiServer = new ApiServerService(opts.app, opts.backendless.apiServer);
  
  let registered = false;
  
  if (opts.keepZip) {
    fs.writeFile('deploy.zip', zipped);
    logger.info(`Deployment archive is saved to ${path.resolve('deploy.zip')}`);
  }

  Promise.resolve()
    .then(() => apiServer.registerRunner()) // http://bugs.backendless.com/browse/BKNDLSS-11655
    .then(() => registered = true)
    .then(() => apiServer.registerModel(model))
    .then(() => apiServer.publish(zipped))
    .catch(err => {
      const message = String(err.message || err);

      logger.error(message);

      if (message.includes(APP_SIZE_LIMIT_REACHED)) {
        logger.info('You can decrease an application deployment zip size by adding an exclusion filters to your {app.files} config parameter. ');
      }
    })
    .then(() => registered && apiServer.unregisterRunner());
};

function generateZip(model, patterns) {
  logger.info('Preparing app zip file for deployment..');
  logger.debug('File patterns to be included:');

  patterns.forEach(pattern => logger.debug(pattern));

  const zip = new JSZip();
  const expanded = file.expand(patterns);
  let files = 0;

  zip.file('model.json', JSON.stringify(model));

  expanded.forEach(item => {
    if (fs.statSync(item).isDirectory()) {
      zip.folder(item);
    } else {
      zip.file(item, fs.readFileSync(item));
      files++;
    }
  });

  logger.info(`${files} files added into deployment archive`);

  return zip.generate({ type: 'nodebuffer' });
}

function dependencyPatterns() {
  const pkgFile = path.resolve('package.json');

  if (fs.existsSync(pkgFile)) {
    const pkg = require(pkgFile);

    if (pkg.dependencies) {
      return (Object.keys(pkg.dependencies)).map(dep => {
        return `node_modules/${dep}/**`;
      });
    }
  } else {
    logger.info('Warning. Working directory doesn\'t contain package.json file. ' +
      'CodeRunner is not able to optimize application deployment size');

    return ['node_modules/**'];
  }

  return [];
}