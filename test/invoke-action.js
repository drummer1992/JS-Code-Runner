'use strict';

const executor = require('../lib/server-code/runners/tasks/executor');
const should = require('should');
const SHUTDOWN = 'SHUTDOWN';

require('mocha');

/**
 * @param {String} actionType
 * @returns {CodeRunnerTask}
 */
function createTask(actionType) {
  return {
    ___jsonclass : executor.RAI,
    actionType   : actionType,
    applicationId: '',
    relativePath : ''
  };
}

describe('[invoke-action] task executor', function() {
  describe('on SHUTDOWN action', function() {
    it('should stop the CodeRunner process', function() {
      const exit = process.exit;
      let exitCalled = false;

      process.exit = function() {
        exitCalled = true;
      };

      process.exit.restore = function() {
        process.exit = exit;
      };

      return executor.execute(createTask(SHUTDOWN), { backendless: { repoPath: '' } })
        .then(process.exit.restore, process.exit.restore)
        .then(() => should.equal(exitCalled, true));
    });
  });
});