"use strict";

const denodeify = require('../../util/promise').denodeify,
      request   = denodeify(require('request')),
      logger    = require('../../util/logger');

/**
 * @param {{body:Object, statusCode:number, statusMessage:String}} res
 * @returns {*}
 */
function parseError(res) {
  return (res.body && res.body.message)
    || res.body
    || `Status Code ${res.statusCode} (${res.statusMessage})`;
}

function sendRequest(url, runnerId, requestId) {
  return request({
    url : `${url}`,
    json: true,
    qs  : {
      coderunnerId: runnerId,
      requestId   : requestId,
      lang        : 'JS'
    }
  });
}

class DriverService {
  constructor(url, runnerId) {
    this.url = url;
    this.runnerId = runnerId;
  }

  getRequest(requestId) {
    logger.info('Getting task from CodeRunner Driver');

    return sendRequest(`${this.url}/getRequest`, this.runnerId, requestId)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info('Task successfully received');
          return res.body;
        }

        throw new Error(`Error. ${parseError(res)}`);
      });
  }

  sendResult(requestId, result) {
    logger.info('Sending Execution Result back to CodeRunner Driver');

    const options = {
      method: 'POST',
      body  : result
    };

    return sendRequest(`${this.url}/sendResult`, this.runnerId, requestId, options)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info('Successfully sent');
        } else {
          throw new Error(`Error. ${parseError(res)}`);
        }
      });
  }
}

module.exports = DriverService;