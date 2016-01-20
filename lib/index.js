'use strict';

const api = require('./api');
const readConfig = require('./config').read;
const serverCode = require('./services/server-code');
const taskRunner = require('./task-runner');
const model = require('./model');

exports.handler = api.handler;
exports.timer = api.timer;
exports.service = api.service;

exports.debug = function(opts) {
  readConfig(opts)
    .then(model.parse)
    .then(serverCode.registerModel)
    .then(serverCode.registerRunner)
    .then(taskRunner.local.handleTasks)
};

exports.deploy = function(opts) {
  readConfig(opts)
    .then(model.parse)
    //.then(serverCode.registerModel) ??
    .then(serverCode.publish)
    .then(()=> process.exit(0));
};

exports.cloud = function(opts) {
  readConfig(opts)
    .then(serverCode.registerRunner)
    .then(taskRunner.cloud.handleTasks)
};