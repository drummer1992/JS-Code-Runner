'use strict'

const ServerCode = require('../api')
const { addRoute, addParams, addType, makePropOptional } = require('../../util/decorators')

const Params = properties => (target, key) => addParams(properties, target, key)

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

module.exports = {
  Api: {
    Service,
    Route,
    Params,
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