"use strict";

const denodeify = require('../util/promise').denodeify,
      request   = denodeify(require('request')),
      fs        = require('fs'),
      config    = require('../config'),
      logger    = require('../util/logger');

const LANG = 'JAVA'; //TODO: change to JS when it's supported

function getAppHeaders() {
  return {
    'application-id': config.get('app.id'),
    'secret-key'    : config.get('app.secretKey'),
    'AppVersion'    : config.get('app.version')
  };
}

function sendRequest(path, options) {
  options = Object.assign({
    url    : `${config.get('backendless.apiServer')}/servercode/${path}`,
    headers: getAppHeaders()
  }, options);

  return request(options);
}

function parseError(res) {
  return res.body || res.statusMessage || res.statusCode;
}

exports.registerModel = function(model) {
  logger.info('Registering Model on server');

  const opts = {
    method: 'POST',
    json  : true,
    body  : model
  };

  return sendRequest('registermodel', opts)
    .then(res => {
      if (res.statusCode === 200) {
        logger.info('Model successfully registered');
      } else {
        throw new Error(parseError(res));
      }
    });
};

exports.registerRunner = function() {
  logger.info(`Registering runner on ${config.get('backendless.apiServer')}`);

  let options = {
    method: 'POST',
    json  : true,
    body  : {lang: LANG}
  };

  return sendRequest('registerRunner', options, 200)
    .then(function(res) {
      if (res.statusCode === 200) {
        logger.info('Runner successfully registered');
        return res.body.debugId;
      }

      throw new Error('Unable to register Runner. Error: ' + parseError(res));
    });
};

exports.unregisterRunner = function() {
  logger.info('Unregistering runner');

  return sendRequest('unregisterRunner', {});
};

exports.publish = function(appZipFile, modelFile) {
  logger.info('Publishing Model to server');

  let options = {
    method  : 'POST',
    formData: {
      'class-file': fs.createReadStream(appZipFile),
      'model-file': fs.createReadStream(modelFile)
    }
  };

  return sendRequest('publishcode/' + LANG, options)
    .then(res => {
      if (res.statusCode === 200) {
        logger.info('Runner successfully registered');
      } else {
        throw new Error('Unable to publish. Error: ' + parseError(res));
      }
    });
};