'use strict';

const denodeify = require('../../util/promise').promisifyNode,
      logger    = require('../../util/logger'),
      request   = denodeify(require('request'));

const LANG = 'JS';

/**
 * @param {{body:Object, statusCode:number, statusMessage:String}} res
 * @returns {*}
 */
function parseError(res) {
  return (res.body && res.body.message)
    || res.body
    || `Status Code ${res.statusCode} (${res.statusMessage})`;
}

class ApiServerService {
  constructor(app, serverUrl) {
    this.app = app;
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

    return request(options).catch((err) => {
      logger.error(`Connection attempt failed. [${err.message}]`);

      throw new Error('Could not connect to Backendless API Server');
    });
  }

  registerModel(model) {
    logger.info(`Registering Model on ${this.serverUrl}`);

    const handlersModel = {
      applicationId: this.app.id,
      appVersionId : this.app.version,
      handlers     : model.handlers.values().map(h => {
        return {
          id      : h.eventId,
          target  : h.target,
          async   : h.async,
          provider: h.file,
          timer   : h.timer
        };
      })
    };

    return this.sendRequest('registermodel', { method: 'POST', json: true, body: handlersModel })
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

    return this.sendRequest('registerRunner', { method: 'POST', json: true, body: { lang: LANG } })
      .then(function(res) {
        if (res.statusCode === 200) {
          logger.info('Runner successfully registered.');
          logger.debug(`Debug Session ID: ${res.body.debugId}`);

          return res.body.debugId;
        }

        throw new Error(`Unable to register Runner. ${parseError(res)}`);
      });
  }

  unregisterRunner() {
    return this.sendRequest('unregisterRunner');
  }

  publish(appZipBuffer) {
    logger.info('Publishing Model to server');

    const options = {
      method  : 'POST',
      json    : true,
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

    return this.sendRequest(`publishcode/${LANG}`, options)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info('Successfully published');
        } else {
          throw new Error(`Unable to publish Model. ${parseError(res)}`);
        }
      });
  }

  registerDebugService(serviceDescriptor) {
    const opts = {
      method: 'POST',
      json  : true,
      body  : {
        name          : serviceDescriptor.name,
        version       : '0.0.0',
        description   : 'debug version',
        configuration : [],
        xmlDescription: serviceDescriptor.toXML()
      }
    };

    return this.sendRequest('services/debug', opts)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info(`Service ${serviceDescriptor.name} successfully deployed`);
        } else {
          throw new Error(`Unable to deploy service. ${parseError(res)}`);
        }
      });
  }

  unregisterDebugServices() {
    return this.sendRequest('services/debug', { method: 'DELETE' })
      .then(res => {
        if (res.statusCode !== 200) {
          throw new Error(`Unable to clear debug services. ${parseError(res)}`);
        }
      });
  }
}

module.exports = ApiServerService;