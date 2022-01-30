'use strict'

const ServerCode = require('../api')
const { addRoute, addParam, addType, makePropOptional } = require('../../util/decorators')

const Service = name => target => {
  if (name) {
    target.___def.name = name
  }

  ServerCode.addService(target)
}

const Dto = name => target => {
  if (name) {
    target.___def.name = name
  }

  ServerCode.addType(target)
}

const Route = (method, path) => (target, key) => addRoute(method, path, target, key)

const Get = path => Route('GET', path)
const Post = path => Route('POST', path)
const Put = path => Route('PUT', path)
const Delete = path => Route('DELETE', path)

const optional = (target, key) => makePropOptional(target, key)
const type = name => (target, key) => addType(name, target, key)

const Param = (options) => (target, key) => {
  addParam(options.type, options.name, options.optional, target, key)
}

module.exports = {
  Api: {
    Service,
    Route,
    Param,
    Get,
    Post,
    Put,
    Delete,
  },
  Schema: {
    Dto,
    optional,
    type,
  },
}