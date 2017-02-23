'use strict';

const logger  = require('../../util/logger'),
      request = require('backendless-request');

const lang = 'JS';
const CODE_SIZE_RESTRICTION = 11007;

const wrapError = operation => error => {
  let message = error.message;

  if (error.code === CODE_SIZE_RESTRICTION) {
    message += (
      '\nYou can decrease an application deployment zip size ' +
      'by adding an exclusion filters to your {app.files} config parameter. '
    );
  }

  throw new Error(`Unable to ${operation}. ${message}`);
};

class ApiServerService {
  constructor(app, serverUrl) {
    this.app = app;
    this.appUrl = `${serverUrl}/${app.id}/${app.apiKey}`;
    this.serverUrl = serverUrl;
  }

  registerModel(model) {
    logger.info(`Registering Model on ${this.serverUrl}`);

    const applicationId = this.app.id;
    const handlers = model.handlers.values().map(h => ({
      id      : h.eventId,
      target  : h.target,
      async   : h.async,
      provider: h.file,
      timer   : h.timer
    }));

    return request.post(this.appUrl + '/servercode/registermodel')
      .send({ applicationId, handlers })
      .then(() => logger.info('Model successfully registered'))
      .catch(wrapError('register Model'));
  }

  registerRunner() {
    logger.info(`Registering Code Runner on ${this.serverUrl}`);

    return request.post(this.appUrl + `/servercode/registerRunner/${lang}`)
      .then(({ debugId }) => {
        logger.info('Runner successfully registered.');
        logger.debug(`Debug Session ID: ${debugId}`);

        return debugId;
      })
      .catch(wrapError('register Runner'));
  }

  unregisterRunner() {
    return request.get(this.appUrl + '/servercode/unregisterRunner');
  }

  publish(appZipBuffer) {
    logger.info('Publishing Model to server');

    const formData = {
      code: {
        value  : appZipBuffer,
        options: {
          filename   : 'code',
          contentType: 'application/zip'
        }
      }
    };

    return request.post(this.appUrl + `/servercode/publishcode/${lang}`)
      .form(formData)
      .then(() => logger.info('Successfully published'))
      .catch(wrapError('publish model'));
  }

  registerDebugServices(services) {
    logger.info('Registering services for debug');

    const body = services.map(s => ({
      lang          : lang,
      name          : s.name,
      version       : s.version,
      description   : s.description,
      xmlDescription: s.xml(),
      configuration : s.configItems
    }));

    return request.post(this.appUrl + '/servercode/services/debug', body)
      .then(() => logger.info('Services successfully registered'))
      .catch(wrapError('register services'));
  }

  publishServices(appZipBuffer) {
    logger.info('Publishing Services');

    const formData = {
      services: {
        value  : appZipBuffer,
        options: {
          filename   : 'services.zip',
          contentType: 'application/zip'
        }
      }
    };

    return request.post(this.appUrl + '/servercode/services')
      .form(formData)
      .then(() => logger.info('Services successfully published'))
      .catch(wrapError('publish services'));
  }

  unregisterDebugServices() {
    logger.info('Clearing Debug Services');

    return request.delete(this.appUrl + '/servercode/services/debug')
      .catch(wrapError('clear debug services'));
  }
}

module.exports = ApiServerService;