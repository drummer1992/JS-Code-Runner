'use strict';

let request = require('request');

/**
 * A simple wrapper around http request to provide promise based requests
 */
module.exports = function(options, expectedStatus) {
  return new Promise(function(resolve, reject) {
    request(options, function(err, res, body) {

      if (err) {
        return reject(err);
      }

      if (expectedStatus && expectedStatus !== res.statusCode) {
        err = new Error("Unexpected status code: " + res.statusCode);
        err.res = res;
        return reject(err);
      }

      resolve(body);
    });
  });
};