'use strict';

const glob = require('glob'),
      fs   = require('fs');

/**
 * Process specified wildcard glob patterns or file names against a
 * callback, excluding and uniquing files in the result set.
 *
 * @param {Array.<string>} patterns
 * @param {function} predicate pattern matcher
 *
 * @returns {Array.<string>} found files
 */
exports.processPatterns = function(patterns, predicate) {
  const result = [];

  patterns.forEach(function(pattern) {
    const exclusion = pattern.indexOf('!') === 0;

    if (exclusion) {
      pattern = pattern.slice(1);
    }

    const matches = predicate(pattern);

    matches.forEach((file) => {
      const pos = result.indexOf(file);

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
 * @param {Object=} opts
 * @returns {Array.<string>}
 */
exports.expand = function(patterns, opts) {
  return exports.processPatterns(patterns, function(pattern) {
    return glob.sync(pattern, opts);
  });
};

/**
 * Promise based file read
 * @param {String} file
 * @param {String} encoding
 * @returns {Promise.<String>}
 */
exports.read = function(file, encoding) {
  encoding = encoding || 'utf8';

  return new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};