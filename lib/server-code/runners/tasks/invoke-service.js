'use strict';

const logger = require('../../../util/logger');

module.exports = function(task, model) {
  logger.debug(`Invoking service task:
      task : ${JSON.stringify(task)}
      model: ${JSON.stringify(model)}`);
};