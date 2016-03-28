/* global Backendless */

'use strict';

class HelloWorldService {

  /**
   * @param {Date} d
   * @returns {string}
   */
  getGreeting(d) {
    return 'Hello World!';
  }
}

Backendless.ServerCode.addService(HelloWorldService);