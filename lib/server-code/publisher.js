'use strict';

const ServerCodeModel   = require('./model'),
      logger            = require('../util/logger'),
      path              = require('path'),
      fs                = require('fs'),
      file              = require('../util/file'),
      JSZip             = require('jszip'),
      ApiServerService = require('./services/api-server');

exports.publish = function(opts) {
  const apiServer = new ApiServerService(opts.app, opts.backendless.apiServer);

  let registered;
  let zipped;
  let model;

  function buildModel() {
    model = ServerCodeModel.build(process.cwd(), file.expand(opts.app.files, { nodir: true }));
    
    if (model.isEmpty() && !opts.allowEmpty) {
      throw new Error('Nothing to publish');
    }
  }

  function zip() {
    zipped = generateZip(model, dependencyPatterns().concat(opts.app.files), opts.keepZip);
  }

  function publishHandlers() {
    if (model.handlers.values().length) {
      return apiServer.registerModel(model).then(() => {
        return apiServer.publish(zipped);
      });
    }
  }

  function publishServices() {
    const services = model.services.values();

    if (services.length) {
      return apiServer.unregisterDebugServices()
        .then(() => Promise.all(services.map((s) => {
          return apiServer.publishService(s, zipped);
        })));
    }
  }

  function registerRunner() {
    return apiServer.registerRunner() // http://bugs.backendless.com/browse/BKNDLSS-11655
      .then(() => registered = true); 
  }

  function finalize() {
    if (registered) {
      registered = false;

      return apiServer.unregisterRunner();
    }
  }

  return Promise.resolve()
    .then(buildModel)
    .then(zip)
    .then(registerRunner)
    .then(publishHandlers)
    .then(publishServices)
    .then(finalize)
    .catch(err => {
      finalize();

      throw err;
    });
};

function generateZip(model, patterns, keep) {
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

  const result = zip.generate({ type: 'nodebuffer' });

  if (keep) {
    fs.writeFile('deploy.zip', result);
    logger.info(`Deployment archive is saved to ${path.resolve('deploy.zip')}`);
  }

  return result;
}

function dependencyPatterns() {
  const pkgFile = path.resolve('package.json');

  const result = ['node_modules/**'];
  
  if (fs.existsSync(pkgFile)) {
    const pkg = require(pkgFile);

    if (pkg.devDependencies) {
      Object.keys(pkg.devDependencies).forEach(dep => {
        result.push(`!node_modules/${dep}`);
      });
    }
  } else {
    logger.info('Warning. Working directory doesn\'t contain package.json file. ' +
      'CodeRunner is not able to optimize application deployment size');
  }

  return result;
}