'use strict';

const Console = require('console').Console,
      util    = require('util');

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

var Logger = module.exports = Console(process.stdout);

var log = Logger.log;
var error = Logger.error;

Logger.info = Logger.log = function() {
  log.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
};

Logger.error = function() {
  error.call(this, '%s - %s', timestamp(), util.format.apply(util, arguments));
};

var verboseMode = false;

Logger.verbose = function(value) {
  if (arguments.length === 1) {
    verboseMode = !!value;
  }

  return verboseMode;
};

Logger.debug = function() {
  verboseMode && Logger.log.apply(Logger, arguments);
};