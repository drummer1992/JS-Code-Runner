'use strict'

const { ClassDef, TypeDef } = require('./definition')

const getClassDef = (target) => {
  if (!target.constructor.___def) {
    target.constructor.___def = new ClassDef(target.constructor.name)
  }

  return target.constructor.___def
}

const getMethodDef = (target, key) => getClassDef(target).method(key)
const getPropertyDef = (target, key) => getClassDef(target).property(key)

const addRoute = (method, path, target, key) => {
  const methodRef = getMethodDef(target, key)

  methodRef.addTag('route', `${method} ${path}`)
}

const addParam = (type, name, optional, target, key) => {
  const methodDef = getMethodDef(target, key)

  methodDef.addParam(name, new TypeDef(type), Boolean(optional), {
    inFront: true,
  })
}

const addReturnType = (type, target, key) => {
  const methodDef = getMethodDef(target, key)

  methodDef.returnType = new TypeDef(type)
}

const addPropertyType = (name, target, key) => {
  const propertyDef = getPropertyDef(target, key)

  propertyDef.type = new TypeDef(name)
}

module.exports = { addRoute, addParam, addPropertyType, addReturnType }