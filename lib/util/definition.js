'use strict'

class ClassDef {
  constructor(name) {
    this.name = name
    this.methods = {}
    this.properties = {}
  }

  property(name) {
    return this.properties[name] || (this.properties[name] = new PropertyDef())
  }

  method(name) {
    return this.methods[name] || (this.methods[name] = new MethodDef())
  }
}

class PropertyDef {
  type(value) {
    this.type = value
    return this
  }
}

class MethodDef {
  constructor() {
    this.params = []
    this.tags = {}
    this.access = 'public'
    this.returnType = new TypeDef('void')
  }

  addParam(name, type, optional, { inFront = false } = {}) {
    const method = inFront ? 'unshift' : 'push'

    this.params[method](new ParamDef(name, type, optional))
  }

  addTag(name, value) {
    this.tags[name] = value
  }
}

class ParamDef {
  constructor(name, type, optional) {
    this.name = name
    this.type = type
    this.optional = optional
  }
}

class TypeDef {
  constructor(type) {
    this.name = TypeDef.trim(type)

    const elementType = TypeDef.parseElementType(type)

    if (elementType) {
      this.elementType = new TypeDef(elementType)
    }
  }

  static trim(type) {
    const splitterPos = type.indexOf('.')

    return type.substring(0, splitterPos !== -1 ? splitterPos : undefined)
  }

  static parseElementType(type) {
    const result = type.match(/<(.*)>/)

    return result && result[1] || ''
  }
}

module.exports = {
  ClassDef,
  TypeDef,
}