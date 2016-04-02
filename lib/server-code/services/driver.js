'use strict';

const logger = require('../../util/logger'),
      http   = require('http'),
      qs     = require('querystring');

/**
 * @param {{body:Object, statusCode:number, statusMessage:String}} res
 * @returns {*}
 */
function parseError(res) {
  return (res.body && res.body.message)
    || res.body
    || `Status Code ${res.statusCode} (${res.statusMessage})`;
}

function parseResponseBody(res, body) {
  if (res.statusCode === 404) {
    body = null;
  } else if (res.headers['content-type'] === 'application/json') {
    body = JSON.parse(body);
  }

  return body;
}

class DriverService {
  constructor(host, port, runnerId) {
    this.host = host;
    this.port = port;
    this.runnerId = runnerId;
  }

  send(path, method, requestId, postData) {
    return new Promise((resolve, reject) => {

      const queryParams = {
        coderunnerId: this.runnerId,
        requestId   : requestId,
        lang        : 'JS'
      };

      const options = {
        hostname: this.host,
        port    : this.port,
        method  : method,
        path    : `/${path}?${qs.stringify(queryParams)}`
      };

      const req = http.request(options, (res) => {
        res.setEncoding('utf8');

        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          resolve({
            statusCode   : res.statusCode,
            statusMessage: res.statusMessage,
            headers      : res.headers,
            body         : parseResponseBody(res, body)
          });
        });
        res.on('error', reject);
      });

      if (postData) {
        req.write(postData);
      }

      req.on('error', reject);
      req.end();
    });
  }

  getRequest(requestId) {
    logger.debug('Getting task from CodeRunner Driver');

    return this.send('getRequest', 'GET', requestId)
      .then(res => {
        if (res.statusCode === 200) {
          logger.debug('Task successfully received');
          return res.body;
        }

        throw new Error(parseError(res));
      });
  }

  sendResult(requestId, result) {
    logger.debug('Sending Execution Result back to CodeRunner Driver');

    return this.send('sendResult', 'POST', requestId, result)
      .then(res => {
        if (res.statusCode === 200) {
          logger.debug('Successfully sent');
        } else {
          throw new Error(parseError(res));
        }
      });
  }
}

module.exports = DriverService;