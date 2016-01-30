"use strict";

const request = require('request'),
      config  = require('../../config'),
      logger  = require('../../util/logger');

function sendRequest(path) {
  request({
    url : `${config.get('driverUrl')}/${path}`,
    json: true,
    qs  : {
      codeRunnerId: config.get('driverRunnerId'),
      requestId   : config.get('driverRequestId'),
      lang        : 'js'
    }
  });
}

exports.getRequest = function() {
  logger.info('Getting Request from Driver');

  return sendRequest('getRequest');
};

exports.sendResult = function(result) {
  logger.info('Sending Execution Result back to Driver');

  return sendRequest('sendResult', {
    method: 'POST',
    body  : result
  });
};