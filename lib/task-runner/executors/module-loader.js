"use strict";

var CodeRunner = require('../../index');
var Module = require('module');
var path = require('path');

var moduleLoader = exports;

moduleLoader.load = function(modulePath) {

  var codeRunnerModule = new Module(modulePath, this);
  codeRunnerModule.require = function(path) {
    if (path === 'backendless-coderunner') {
      return CodeRunner;
    }

    return Module.prototype.require.apply(this, arguments);
  };

  return codeRunnerModule.load(path.resolve(modulePath));
};
