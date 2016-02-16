"use strict";

const denodeify = require('../../util/promise').denodeify,
      logger    = require('../../util/logger'),
      request   = denodeify(require('request'));

const LANG = 'JS'; //TODO: change to JS when it's supported

/**
 * @param {{body:Object, statusCode:number, statusMessage:String}} res
 * @returns {*}
 */
function parseError(res) {
  return (res.body && res.body.message)
    || res.body
    || `Status Code ${res.statusCode} (${res.statusMessage})`;
}

class ServerCodeService {
  constructor(app, serverUrl) {
    this.serverUrl = serverUrl;

    this.appHeaders = {
      'application-id': app.id,
      'secret-key'    : app.secretKey,
      'AppVersion'    : app.version
    };
  }

  sendRequest(path, options) {
    options = Object.assign({
      url    : `${this.serverUrl}/servercode/${path}`,
      headers: this.appHeaders
    }, options);

    return request(options);
  }

  registerModel(model) {
    logger.info(`Registering Model on ${this.serverUrl}`);

    return this.sendRequest('registermodel', {method: 'POST', json: true, body: model})
      .then(res => {
        if (res.statusCode === 200) {
          logger.info('Model successfully registered');
        } else {
          throw new Error(`Unable to register Model. ${parseError(res)}`);
        }
      });
  }

  registerRunner() {
    logger.info(`Registering Code Runner on ${this.serverUrl}`);

    return this.sendRequest('registerRunner', {method: 'POST', json: true, body: {lang: LANG}})
      .then(function(res) {
        if (res.statusCode === 200) {
          logger.info('Runner successfully registered.');
          logger.debug('Debug Session ID: ' + res.body.debugId);

          return res.body.debugId;
        }

        throw new Error(`Unable to register Runner. ${parseError(res)}`);
      });
  }

  unregisterRunner() {
    logger.info(`Unregistering runner on ${this.serverUrl}`);

    return this.sendRequest('unregisterRunner');
  }

  publish(appZipBuffer) {
    logger.info('Publishing Model to server');

    let options = {
      method  : 'POST',
      formData: {
        code: {
          value  : appZipBuffer,
          options: {
            filename   : 'code',
            contentType: 'application/zip'
          }
        }
      }
    };

    return this.sendRequest('publishcode/' + LANG, options)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info('Successfully published');
        } else {
          throw new Error(`Unable to publish Model. ${parseError(res)}`);
        }
      });
  }
}

module.exports = ServerCodeService;