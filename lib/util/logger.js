'use strict';

const util = require('util');

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}

function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
    pad(d.getMinutes()),
    pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}

var verboseMode = false;

var logger = module.exports = {};

logger.info = logger.log = function() {
  console.log.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
};

logger.error = function() {
  console.error.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
};

logger.verbose = function(value) {
  if (arguments.length === 1) {
    verboseMode = !!value;
  }

  return verboseMode;
};

logger.debug = function() {
  verboseMode && logger.log.apply(logger, arguments);
};