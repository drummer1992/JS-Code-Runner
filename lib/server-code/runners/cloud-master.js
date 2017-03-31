'use strict';

const cluster = require('cluster');
const logger = require('../../util/logger');

module.exports = function(opts) {

  const numCPUs = require('os').cpus().length;
  const workersCount = opts.workers || numCPUs;

  logger.info(`Starting Backendless Cloud Code Runner for JS with ${workersCount} workers...`);
  logger.info(`Backendless Repository Path is set to [${opts.backendless.repoPath}]`);

  const startWorker = () => {
    const worker = cluster.fork();

    logger.info(`[${worker.process.pid}] Worker started`);
  };

  for (let i = 0; i < workersCount; i++) {
    startWorker();
  }

  cluster.on('exit', (worker) => {
    logger.info(`[${worker.process.pid}] Worker exited`);

    startWorker();
  });

  logger.info('Ready and waiting for Server Code tasks..');

};