'use strict';

const logger = require('./util/logger');

const Backendless = require('backendless');

const CONSUL_PORT = process.env.CONSUL_PORT;
const CONSUL_HOST = process.env.CONSUL_HOST;
const CONSUL_URL = CONSUL_PORT ? `${CONSUL_HOST}:${CONSUL_PORT}` : CONSUL_HOST;

exports.load = async function(opts) {
  if (!CONSUL_HOST) {
    return opts
  }

  opts.backendless = opts.backendless || {};
  opts.backendless.msgBroker = opts.backendless.msgBroker || {};

  await Promise.all([
    loadValueFromConsul(opts, 'sandbox', 'config/coderunner/js/sandbox'),
    loadValueFromConsul(opts, 'verbose', 'config/coderunner/js/verbose'),
    loadValueFromConsul(opts.backendless, 'apiServer', 'play/url'),
    loadValueFromConsul(opts.backendless, 'repoPath', 'repo/path'),
    loadValueFromConsul(opts.backendless, 'workers', 'config/coderunner/js/workers'),
    loadValueFromConsul(opts.backendless.msgBroker, 'host', 'config/redis/bl/production/host'),
    loadValueFromConsul(opts.backendless.msgBroker, 'port', 'config/redis/bl/production/port'),
    loadValueFromConsul(opts.backendless.msgBroker, 'password', 'config/redis/bl/production/password'),
    loadValueFromConsul(opts.backendless.msgBroker, 'max_attempts', 'config/redis/bl/production/max_attempts'),
  ]);

  return opts
};

async function loadValueFromConsul(object, property, consulKey) {
  logger.info(`load config value from Consul, key: [${consulKey}]`);

  try {
    let consulValue = await Backendless.Request.get(`${CONSUL_URL}/v1/kv/${consulKey}?raw`);

    if (consulValue !== undefined) {
      object[property] = consulValue;
    }
  } catch (e) {
    logger.error(`can not load config value from Consul, key: [${consulKey}], error:`, e);
  }
}
