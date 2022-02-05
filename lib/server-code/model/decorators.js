'use strict'

const Backendless = require('backendless')
const assert = require('assert')

const { addRoute, addParam, addPropertyType, addReturnType } = require('../../util/decorators')

const Service = target => {
  Backendless.ServerCode.addService(target)
}

const Type = target => {
  Backendless.ServerCode.addType(target)
}

const Route = (method, path) => (target, key) => addRoute(method, path, target, key)

const Get = path => Route('GET', path)
const Post = path => Route('POST', path)
const Put = path => Route('PUT', path)
const Delete = path => Route('DELETE', path)

const resolvePropertyType = (type, target, key) => {
  if (!type) {
    require('reflect-metadata')

    type = Reflect.getMetadata('design:type', target, key)
  }

  assert(type, `Type definition for '${target.constructor.name}.${key}' is not defined`)

  return type
}

const Property = type => (target, key) => {
  const resolvedType = resolvePropertyType(type, target, key)

  addPropertyType(resolvedType, target, key)
}

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