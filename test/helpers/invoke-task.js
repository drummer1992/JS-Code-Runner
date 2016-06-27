const executor = require('../../lib/server-code/runners/tasks/executor'),
      json     = require('../../lib/util/json'),
      argsUtil = require('../../lib/server-code/runners/tasks/util/args');

/**
 * @param {Object} task
 * @param {Object} model
 * @returns {Promise.<Object>}
 */
module.exports = function(task, model) {
  return executor.execute(task, { backendless: { repoPath: '' } }, model)
    .then(res => res && json.parse(res))
    .then(res => {
      if (res && res.arguments) {
        res.arguments = res.arguments && argsUtil.decode(res.arguments);
      }

      return res;
    });
};