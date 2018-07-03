'use strict';

function prompt(message) {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });

  return new Promise((resolve) => {
    rl.question(message, (value) => {
      rl.close();
      resolve(value);
    });
  });
}

function confirmation(msg) {
  return prompt(msg).then((answer = '') => {
    answer = answer.toUpperCase();

    if (answer === 'Y' || answer === 'YES') {
      return true;
    }

    if (answer === 'N' || answer === 'NO') {
      return false;
    }
  });
}

exports.prompt = prompt;
exports.confirmation = confirmation;