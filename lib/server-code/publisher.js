'use strict';

const ServerCodeModel  = require('./model'),
      logger           = require('../util/logger'),
      path             = require('path'),
      fs               = require('fs'),
      file             = require('../util/file'),
      JSZip            = require('jszip'),
      ApiServerService = require('./services/api-server');

const PACKAGE_FILE = 'package.json';

exports.publish = function(opts) {
  const apiServer = new ApiServerService(opts.app, opts.backendless.apiServer);

  let registered;
  let zipped;
  let model;

  function buildModel() {
    model = ServerCodeModel.build(process.cwd(), opts.app.exclude);

    if (model.isEmpty() && !opts.allowEmpty) {
      throw new Error('Nothing to publish');
    }

    if (model.errors.length) {
      throw new Error('Please resolve Model Errors before deploying to production');
    }
  }

  function zip() {
    const exclude = (opts.app.exclude || []).map(pattern => '!' + pattern);
    const patterns = ['**'].concat(dependencyPatterns()).concat(exclude);

    zipped = generateZip(model, patterns, opts.keepZip);
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
      return apiServer.publishServices(zipped);
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

    return Promise.resolve();
  }

  return Promise.resolve()
    .then(buildModel)
    .then(zip)
    .then(registerRunner)
    .then(publishHandlers)
    .then(publishServices)
    .then(finalize)
    .catch(err => finalize().then(() => Promise.reject(err)));
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
  const pkgFile = path.resolve(PACKAGE_FILE);

  const result = [];

  if (fs.existsSync(pkgFile)) {
    addDependencies(result, require(pkgFile));
  } else {
    logger.info(
      "Warning. Working directory doesn't contain package.json file. " +
      'CodeRunner is not able to auto include dependencies into deployment'
    );
  }

  return result;
}

function addDependencies(out, pkg) {
  pkg && pkg.dependencies && Object.keys(pkg.dependencies).reduce(addDependency, out);
}

function addDependency(out, name) {
  const pattern = `node_modules/${name}/**`;

  if (out.indexOf(pattern) === -1) {
    out.push(pattern);

    try {
      addDependencies(out, require(path.resolve('node_modules', name, PACKAGE_FILE)));
    } catch (err) {
      // dependency not found at the root level. for npm2 it's ok
    }
  }

  return out;
}