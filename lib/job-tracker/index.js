"use strict";

function start(tracker) {
  return function() {
    let TrackerClass = require(tracker);
    let result = new TrackerClass(...arguments);

    result.start();

    return result;
  };
}

exports.startLocal = start('./local');
exports.startCloudDriverDriven = start('./cloud/driven');
exports.startCloudStandalone = start('./cloud/standalone');