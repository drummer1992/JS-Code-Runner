'use strict';

const cluster = require('cluster');
const logger = require('../../util/logger');

const WORKER_TEARDOWN_TIME = 10000; //10 seconds

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

    clearTimeout(worker.expireTimer);

    startWorker();
  });

  cluster.on('message', (worker, message) => {
    if (message.task && message.task.timeout) {
      const timeout = message.task.timeout;

      worker.expireTimer = setTimeout(() => {
        logger.info(`[${worker.process.pid}] Worker expired due to task timeout (${timeout}ms)`);

        worker.process.kill('SIGKILL');
      }, timeout + WORKER_TEARDOWN_TIME);
    }
  });

  logger.info('Ready and waiting for Server Code tasks..');

};