'use strict';

const logger = require('../../../util/logger'),
      json   = require('../../../util/json');

function decodeTaskArguments(args, classMappings) {
  return args && args.length && json.parse(new Buffer(args).toString(), classMappings) || [];
}

module.exports = function(task, model) {
  logger.debug(`Invoking service task:
      task : ${JSON.stringify(task, null, 2)}
      task args: ${JSON.stringify(decodeTaskArguments(task.arguments, {}))}
      model: ${JSON.stringify(model, null, 2)}`);
};