'use strict'

const { ClassDef, TypeDef } = require('./definition')

const getClassDef = (target) => {
  if (!target.constructor.___def) {
    target.constructor.___def = new ClassDef(target.constructor.name)
  }

  return target.constructor.___def
}

const getMethodDef = (target, key) => getClassDef(target).method(key)

const addRoute = (method, path, target, key) => {
  const methodRef = getMethodDef(target, key)

  methodRef.addTag('route', `${method} ${path}`)

  methodRef.access = 'public'
}

const resolveParam = param => typeof param === 'string' ? { type: param } : param

const resolveProperties = properties => typeof properties === 'function'
  ? properties.___def.properties
  : properties

const resolveType = type => type instanceof TypeDef ? type : new TypeDef(type)

const addParams = (maybeProperties, target, key) => {
  const properties = resolveProperties(maybeProperties)
  const methodDef = getMethodDef(target, key)

  Object.keys(properties).forEach(name => {
    const param = resolveParam(properties[name])
    const type = resolveType(param.type)

    methodDef.addParam(name, type, Boolean(param.optional))
  })
}

const addType = (name, target, key) => {
  const classDef = getClassDef(target)

  classDef.property(key).type = new TypeDef(name)
}

const makePropOptional = (target, key) => {
  const classDef = getClassDef(target)

  classDef.property(key).optional = true
}

module.exports = { addRoute, addParams, addType, makePropOptional }