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

## Docs & Help
 - [Troubleshooting guide](docs/Troubleshooting.md)
 - [Debug Code](docs/Debug.md)
 - [Code Generation](docs/Codegen.md)
 - [Custom Business Logic with JavaScript Documentation](https://backendless.com/documentation/business-logic/js/bl_overview.htm)
 - [Changelog](CHANGELOG.md)