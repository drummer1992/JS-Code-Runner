'use strict';

const supertest = require('supertest');

/**
 * @param {Object} app
 * @returns {Function.<Test>}
 */
module.exports = function(app) {

  /**
   * @param {String} method
   * @param {String} path
   * @param {Object=} body
   * @returns {Test}
   */
  return function(method, path, body) {
    const result = supertest(`${app.server}/${app.version}`)[method](path)
      .set('application-id', app.id)
      .set('secret-key', app.restKey);
    
    if (body) {
      result.send(body);
    }
    
    return result;
  };
};