/* eslint no-console:0 */

'use strict';

const Backendless = require('backendless');
const util = require('util');

const serverCodeLogger = Backendless.Logging.getLogger('SERVER_CODE');

const CODE_RUNNER_TS_PATTERN = /^(\d\d:?){3}.\d{3} - /; //16:39:08.792 -

const removeCodeRunnerTS = s => s.replace(CODE_RUNNER_TS_PATTERN, '');

/**
 * Forwards console messages into Backendless.Logging stream
 *
 * @param {String} methodName   A console method name being hooked
 * @param {String} logCategory  A Backendless.Logging log category to which to forward console messages
 */
const hookConsoleLogging = (methodName, logCategory) => {
  const _method = console[methodName];

  console[methodName] = function() {
    _method.apply(console, arguments);

    const message = removeCodeRunnerTS(util.format.apply(null, arguments));

    serverCodeLogger[logCategory](message);
  };
};

/**
 * Forwards global 'console' methods calls to go trough 'SERVER_CODE' Backendless Logger
 */
exports.attach = () => {
  hookConsoleLogging('log', 'info');
  hookConsoleLogging('warn', 'warn');
  hookConsoleLogging('error', 'error');
};