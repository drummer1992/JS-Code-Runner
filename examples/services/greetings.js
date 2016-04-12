/* global Backendless */

'use strict';

const DICT = {};
DICT['English'] = 'Welcome';
DICT['German'] = 'Willkommen';
DICT['Spanish'] = 'Bienvenido';

class GreetingsService {
  /**
   * @param {String} userName
   * @returns {String}
   */
  getGreeting(userName) {
    return `${DICT[this.config.lang]} ${userName} !`;
  }
}

GreetingsService.configItems = [
  {
    name        : 'lang',
    displayName : 'Language',
    required    : true,
    type        : 'choice',
    defaultValue: 'English',
    options     : ['English', 'German', 'Spanish'],
    hint        : 'Please select a Greetings Language'
  }
];

// GreetingsService.configItems = Backendless.ServerCode.ServiceConfigBuilder()
//   .addChoise('lang', 'Language', true, ['English', 'German', 'Spanish'], 'English', 'Please select a Greetings Language')
//   .build();

Backendless.ServerCode.addService(GreetingsService);