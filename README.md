# Backendless CodeRunner for Node.js

This is a tool allowing to write, debug and deploy your Backendless custom business logic

[![Build Status](https://img.shields.io/travis/Backendless/JS-Code-Runner/master.svg?style=flat)](https://travis-ci.org/Backendless/JS-Code-Runner)
[![npm version](https://img.shields.io/npm/v/backendless-coderunner.svg?style=flat)](https://www.npmjs.com/package/backendless-coderunner)

## Getting Started
  1. Create a new node.js project for your Backendless Business Logic
  2. Add `backendless-coderunner` tool as a dev dependency

    `npm i backendless-coderunner --save-dev`

  3. Put your business logic code under `{projectDir}/app` directory.
  4. Deploy it to production

    `node_modules/.bin/coderunner deploy`


## Code Generation
  Custom business logic generator simplifies the development process. The code generator is a part of Backendless Console. Developers use the graphical interface to select API events and schedule timers for which the system generates code in real-time. The generated code includes everything a developer needs in order to add custom business logic.

  1. Please follow [this instruction](https://backendless.com/documentation/business-logic/php/bl_code_generation_php.htm) to generate and download the code. Generated zip file contains generated code and package.json with a single `backendless-coderunner` dependency.
  2. After generating, downloading and unzipping the code, install the coderunner :

    `npm i`

  3. Modify the code according to your needs.
  4. Deploy the changes to Backendless :

    `npm run deploy`


## Debug Code
[Using IntelliJ IDEA](https://github.com/Backendless/JS-Code-Runner/wiki/Debugging-Server-Code-in-WebStorm)

[Using node-inspector](https://github.com/Backendless/JS-Code-Runner/wiki/Debugging-ServerCode-using-node-inspector)

## Configure CodeRunner
    TODO: Describe me
