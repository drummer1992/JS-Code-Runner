/* global Backendless */

'use strict';

class GreetingsService {

  /**
   * @param {String} userName
   * @returns {string}
   */
  getGreeting(userName) {
    return `Hello ${userName}`;
  }
}

Backendless.ServerCode.addService(GreetingsService);