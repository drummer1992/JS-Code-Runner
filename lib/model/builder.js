"use strict";

const logger = require('../util/logger'),
      file   = require('../util/file'),
      script = require('./script');

//function discoverHandlers(files) {
//  return new Promise(function(resolve, reject) {
//    if (!files.length) {
//      return reject('Business Logic files not found');
//    }
//
//    var result = {
//      handlers: [],
//      errors  : []
//    };
//
//    var processed = 0;
//
//    logger.info('Processing Business Logic files..');
//
//    function markProcessed() {
//      processed++;
//
//      if (processed === files.length) {
//        resolve(result);
//      }
//    }
//
//    files.forEach(file => {
//      script.analyse(file)
//        .then((handlers)=> {
//          if (handlers) {
//            result = result.concat(handlers);
//          }
//
//          markProcessed();
//        })
//        .catch(error => {
//          logger.error(`[${file}] ${error.message || error}`);
//        });
//    });
//  });
//}

function analyseFile(file) {
  return script.analyse(file).catch(() => []);
}

function analyseFiles(files) {
  let handlers = [];
  let processed = 0;

  return new Promise((resolve)=> {
    files.forEach(file => {
      analyseFile(file).then(fileHandlers => {
        processed++;
        handlers = handlers.concat(fileHandlers);

        if (processed === files.length) {
          resolve(handlers);
        }
      });
    });
  });
}

exports.build = function build(opts) {
  logger.info('Building Model');

  let files = file.expand(opts.app.files, {nodir: true});

  analyseFiles(files)
    .then(function(handlers) {
      if (handlers.length === 0) {
        throw new Error('No valid Business Logic found');
      }

      return {
        applicationId: opts.app.id,
        appVersionId : opts.app.version,
        handlers     : handlers
      };
    });
};