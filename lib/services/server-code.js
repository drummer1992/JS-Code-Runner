"use strict";

const request = require('../util/request-promise'),
      fs      = require('fs'),
      config  = require('../config'),
      logger  = require('../util/logger');

function getAppHeaders() {
  return {
    'application-id': config.get('app.id'),
    'secret-key'    : config.get('app.secretKey'),
    'AppVersion'    : config.get('app.version')
  };
}

function sendRequest(path, options, expectedResult) {
  options = Object.assign({
    url    : `${config.get('backendless.apiServer')}/servercode/${path}`,
    headers: getAppHeaders()
  }, options);

  return request(options, expectedResult);
}

exports.registerModel = function(model) {
  logger.info('Registering Model');

  return sendRequest('registermodel', {
    method: 'POST',
    json  : true,
    body  : model
  });
};

exports.registerRunner = function() {
  logger.info(`Registering runner on ${config.get('backendless.apiServer')}`);

  let options = {
    method: 'POST',
    json  : true,
    body  : {lang: 'php'} //must be js but not supported yet
  };

  return sendRequest('registerRunner', options, 200)
    .then(function(resp) {
      logger.info('Runner successfully registered');

      return resp.debugId; //really ?
    });
};

exports.unregisterRunner = function() {
  return sendRequest('unregisterRunner', null, 200);
};

exports.publish = function(appZipFile, modelFile) {
  logger.info('Publishing Model');

  return sendRequest('unregisterRunner', {
    method  : 'POST',
    formData: {
      'class-file': fs.createReadStream(appZipFile),
      'model-file': fs.createReadStream(modelFile)
    }
  }, 200);
};