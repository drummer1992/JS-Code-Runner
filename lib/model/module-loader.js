"use strict";

const CodeRunner = require('../index'),
      Module     = require('module'),
      path       = require('path');

const moduleLoader = exports;

moduleLoader.load = function(modulePath) {

  var codeRunnerModule = new Module(modulePath, this);
  codeRunnerModule.require = function(path) {
    if (path === 'backendless-coderunner') {
      return CodeRunner;
    }

    return Module.prototype.require.apply(this, arguments);
  };

  codeRunnerModule.load(path.resolve(modulePath));

  return codeRunnerModule;
};
