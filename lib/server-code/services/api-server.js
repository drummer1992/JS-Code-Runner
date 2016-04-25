'use strict';

const denodeify = require('../../util/promise').promisifyNode,
      logger    = require('../../util/logger'),
      request   = denodeify(require('request'));

const LANG = 'JS';
const CODE_SIZE_RESTRICTION = 11007;

/**
 * @param {{body:Object, statusCode:number, statusMessage:String}} res
 * @param {String} operation
 * @returns {Error}
 */
function failureRespError(res, operation) {
  const result = new Error();

  if (res.body) {
    result.message = res.body.message || res.body;
    result.code = res.body.code;

    const hint = getErrorHint(res.body.code);
    hint && (result.message += `\n${hint}`);
  } else {
    result.message = `Status Code ${res.statusCode} (${res.statusMessage})`;
  }

  result.message = `Unable to ${operation}. \n${result.message}`;

  return result;
}

function getErrorHint(code) {
  if (code === CODE_SIZE_RESTRICTION) {
    return 'You can decrease an application deployment zip size by adding an exclusion filters to your {app.files} config parameter. ';
  }
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
          throw failureRespError(res, 'register Model');
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

        throw failureRespError(res, 'register Runner');
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
          throw failureRespError(res, 'publish Model');
        }
      });
  }

  registerDebugService(service) {
    logger.info(`Registering Service ${service.name} for debug`);

    const opts = {
      method: 'POST',
      json  : true,
      body  : {
        name          : service.name,
        version       : service.version,
        description   : `${service.description} (debug)`,
        configuration : service.configItems,
//        lang          : LANG,
        xmlDescription: service.xml()
      }
    };

    return this.sendRequest('services/debug', opts)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info(`Service ${service.name} successfully registered`);
        } else {
          throw failureRespError(res, `register service ${service.name}`);
        }
      });
  }

  publishService(service, appZipBuffer) {
    logger.info(`Publishing Service ${service.name}`);

    const opts = {
      method  : 'POST',
      json    : true,
      formData: {
        name       : service.name,
        version    : service.version,
        description: service.description,
        lang       : LANG,
        service    : {
          value  : appZipBuffer,
          options: {
            filename   : 'service',
            contentType: 'application/zip'
          }
        }
      }
    };

    return this.sendRequest('services', opts)
      .then(res => {
        if (res.statusCode === 200) {
          logger.info(`Service ${service.name} successfully deployed`);
        } else {
          throw failureRespError(res, `publish service ${service.name}`);
        }
      });
  }

  unregisterDebugServices() {
    logger.info('Clearing Debug Services');

    return this.sendRequest('services/debug', { method: 'DELETE' })
      .then(res => {
        if (res.statusCode !== 200) {
          throw failureRespError(res, 'clear debug services');
        }
      });
  }
}

module.exports = ApiServerService;