'use strict';

const cluster = require('cluster');
const logger = require('../../util/logger');
const managementServer = require('../services/management-server');

const WORKER_TEARDOWN_TIME = 10000; //10 seconds
const DEFAULT_WORKERS_HEARTBEAT_TIMEOUT = 10;

process.title = 'JS CodeRunner Master';

module.exports = function(opts) {
  managementServer.start(opts);

  const numCPUs = require('os').cpus().length;
  const workersCount = opts.workers || numCPUs;

  const activeWorkers = [];

  logger.info(`Starting Backendless Cloud Code Runner for JS with ${workersCount} workers...`);
  logger.info(`Backendless Repository Path is set to [${opts.backendless.repoPath}]`);

  const startWorker = () => {
    const worker = cluster.fork();

    worker.heartbeat = Date.now();

    activeWorkers.push(worker);

    logger.info(`[${worker.process.pid}] Worker started`);
  };

  for (let i = 0; i < workersCount; i++) {
    startWorker();
  }

  cluster.on('exit', (worker) => {
    logger.info(`[${worker.process.pid}] Worker exited`);

    activeWorkers.splice(activeWorkers.indexOf(worker), 1);

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
    } else if (message === 'heartbeat') {
      worker.heartbeat = Date.now();
    }
  });

  logger.info('Ready and waiting for Server Code tasks..');

  const workersHeartbeatTimeout = (opts.workersHeartbeat.timeout || DEFAULT_WORKERS_HEARTBEAT_TIMEOUT) * 1000;

  setInterval(() => {
    activeWorkers.forEach(worker => {
      if (worker.heartbeat + workersHeartbeatTimeout < Date.now()) {
        logger.info(`[${worker.process.pid}] Worker expired due to heartbeat timeout (${workersHeartbeatTimeout}ms)`);

        worker.process.kill('SIGKILL');
      }
    })
  }, workersHeartbeatTimeout);

};