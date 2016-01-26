"use strict";

const glob = require('glob'),
      fs   = require('fs');

const file = exports;

/**
 * Process specified wildcard glob patterns or filenames against a
 * callback, excluding and uniquing files in the result set.
 */
file.processPatterns = function(patterns, fn) {
  var result = [];

  patterns.forEach(function(pattern) {
    var exclusion = pattern.indexOf('!') === 0;

    if (exclusion) {
      pattern = pattern.slice(1);
    }

    var matches = fn(pattern);

    matches.forEach((file)=> {
      var pos = result.indexOf(file);

      if (pos !== -1 && exclusion) {
        result.splice(pos, 1);
      } else if (pos === -1 && !exclusion) {
        result.push(file);
      }
    });

  });

  return result;
};

/**
 * Returns an array of all file paths that match the given wildcard patterns.
 *
 * @param {Array.<string>} patterns
 * @param {Object} opts
 * @return {Promise.<Array.<string>>}
 */
file.expand = function(patterns, opts) {
  return file.processPatterns(patterns, function(pattern) {
    return glob.sync(pattern, opts);
  });
};

/**
 * Promise based file read
 */
file.read = function(file, encoding) {
  encoding = encoding || 'utf8';

  return new Promise((resolve, reject)=> {
    fs.readFile(file, encoding, (err, result)=> {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};