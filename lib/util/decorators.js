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

const stringifyType = type => {
  if (typeof type === 'string') {
    return type
  }

  const mainType = type.constructor.name

  if (Array.isArray(type)) {
    const subType = type[0] && stringifyType(type[0])

    return [mainType, subType && `<${subType}>`].filter(Boolean).join('.')
  }

  return mainType
}

const addParam = (type, name, optional, target, key) => {
  const methodDef = getMethodDef(target, key)

  methodDef.addParam(name, new TypeDef(stringifyType(type)), Boolean(optional), {
    inFront: true,
  })
}

const addReturnType = (type, target, key) => {
  const methodDef = getMethodDef(target, key)

  methodDef.returnType = new TypeDef(type)
}

const addPropertyType = (type, target, key) => {
  const propertyDef = getPropertyDef(target, key)

  propertyDef.type = new TypeDef(stringifyType(type))
}

module.exports = { addRoute, addParam, addPropertyType, addReturnType }