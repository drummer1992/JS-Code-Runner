'use strict';

const buildModel        = require('./model').build,
      file              = require('../util/file'),
      ServerCodeService = require('../services/server-code');

exports.publish = function(opts) {
  const appFiles = file.expand(opts.app.files, {nodir: true});

  ServerCodeService.publish(buildModel(appFiles, opts));
};