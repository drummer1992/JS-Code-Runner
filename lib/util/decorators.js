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
}

const addParam = (type, name, optional, target, key) => {
  const methodDef = getMethodDef(target, key)

  methodDef.addParam(name, new TypeDef(type), Boolean(optional))
}

const addType = (name, target, key) => {
  const classDef = getClassDef(target)

  classDef.property(key).type = new TypeDef(name)
}

const makePropOptional = (target, key) => {
  const classDef = getClassDef(target)

  classDef.property(key).optional = true
}

module.exports = { addRoute, addParam, addType, makePropOptional }