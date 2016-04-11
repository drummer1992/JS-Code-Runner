/* global Backendless */

'use strict';

class GreetingsService {
  /**
   * @param {String} userName
   * @returns {string}
   */
  getGreeting(userName) {
    return `${this.config.lang} ${userName}`;
  }
}

GreetingsService.configItems = [
  {
    name        : 'lang',
    displayName : 'Language',
    required    : true,
    type        : 'boolean',
    defaultValue: 'English',
    options     : ['English', 'German', 'Spanish'],
    hint        : 'Please select a Greetings Language'
  }
];

// GreetingsService.configItems = Backendless.ServerCode.ServiceConfigBuilder()
//   .addChoise('lang', 'Language', true, ['English', 'German', 'Spanish'], 'English', 'Please select a Greetings Language')
//   .build();

Backendless.ServerCode.addService(GreetingsService);