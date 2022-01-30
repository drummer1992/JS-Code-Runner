'use strict'

const ServerCode = require('../api')
const { addRoute, addParam, addPropertyType, addReturnType } = require('../../util/decorators')

const Service = name => target => {
  if (name) {
    target.___def.name = name
  }

  ServerCode.addService(target)
}

const Type = name => target => {
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

const Property = name => (target, key) => addPropertyType(name, target, key)

const Param = (...args) => (target, key) => {
  const options = args.length === 1
    ? args[0]
    : { type: args[0], name: args[1], optional: args[2] }

  addParam(options.type, options.name, options.optional, target, key)
}

const Returns = returnType => (target, key) => {
  addReturnType(returnType, target, key)
}

module.exports = {
  Service,
  Route,
  Param,
  Returns,
  Get,
  Post,
  Put,
  Delete,
  Type,
  Property,
}