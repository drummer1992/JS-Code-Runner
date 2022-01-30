'use strict'

const path = require('path')
const fs = require('fs')
const { ClassDef, TypeDef } = require('./definition')

class FileDescriptor {
  constructor() {
    this.classes = {}
  }

  addClass(name) {
    if (!this.classes[name]) {
      this.classes[name] = new ClassDef(name)
    }

    return this.classes[name]
  }
}

function resolveJSDocPath() {
  const jsDocPaths = [
    path.resolve(__dirname, '../../node_modules/jsdoc/lib'),  //when used as runner
    path.join(process.cwd(), 'node_modules', 'jsdoc', 'lib'), //when used as publisher
  ]

  for (let i = 0; i < jsDocPaths.length; i++) {
    const jsDocPath = jsDocPaths[i]

    if (fs.existsSync(jsDocPath)) {
      return jsDocPath
    }
  }

  throw new Error('Can not resolve path to JSDoc module.')
}

const jsdocPath = resolveJSDocPath()

const jsdocModulePath = module => path.join(jsdocPath, ...module.split('/'))

let _jsdocRequire

const jsdocRequire = modulePath => {
  if (!_jsdocRequire) {
    _jsdocRequire = require('requizzle')({
      infect      : true,
      requirePaths: { before: [jsdocPath] }
    })

    //init jsdoc env
    const Config = _jsdocRequire(jsdocModulePath('jsdoc/config'))
    const env = _jsdocRequire(jsdocModulePath('jsdoc/env'))
    env.conf = new Config().get()
  }

  return _jsdocRequire(jsdocModulePath(modulePath))
}

const parseJSDoc = fileName => {
  const parser = jsdocRequire('jsdoc/src/parser').createParser()
  const handlers = jsdocRequire('jsdoc/src/handlers')

  handlers.attachTo(parser)

  return parser.parse([fileName])
}

const typeFromDoc = doc => {
  const name = doc && doc.names && doc.names[0]

  return name && new TypeDef(name)
}

exports.describeClasses = function (fileName) {
  const docs = parseJSDoc(fileName)
  const fd = new FileDescriptor()

  docs.forEach(item => {
    if (item.kind === 'typedef' || item.kind === 'class') { //class definition
      const classDef = fd.addClass(item.name)
      classDef.description = item.description

      item.properties && item.properties.forEach(prop => {
        classDef.property(prop.name).type = typeFromDoc(prop.type)
      })

    } else if (item.memberof) { //class members

      if (item.kind === 'function') { //class method
        const methodDef = fd.addClass(item.memberof).method(item.name)
        methodDef.returnType = typeFromDoc(item.returns && item.returns[0] && item.returns[0].type)
        methodDef.access = item.access || 'public'
        methodDef.description = item.description

        if (item.params) {
          item.params.forEach(param =>
            methodDef.addParam(param.name, typeFromDoc(param.type), !!param.optional))
        }

        if (item.tags) {
          item.tags.forEach(tag => methodDef.addTag(tag.title, tag.value))
        }

      } else if (item.kind === 'member' && item.scope === 'instance' && item.type) { //class property
        fd.addClass(item.memberof).property(item.name).type = typeFromDoc(item.type)
      }
    }
  })

  return Object.keys(fd.classes).map(name => fd.classes[name])
}