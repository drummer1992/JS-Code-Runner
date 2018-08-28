'use strict'

const fs              = require('fs'),
      path            = require('path'),
      ServerCodeModel = require('./index'),
      logger          = require('../../util/logger'),
      toUnix          = require('../../util/path').toUnix

const DESCRIPTOR_FILE = 'model.json'

function normalizeDictFilePath(dict) {
  Object.keys(dict).forEach(key => {
    if (dict[key].provider) {
      dict[key].provider = toUnix(dict[key].provider)
    }
  })

  return dict
}

class ServerCodeModelDescriptor {
  constructor(basePath, opts) {
    this.basePath = basePath

    this.handlers = normalizeDictFilePath(opts.handlers || {})
    this.types = normalizeDictFilePath(opts.types || {})
    this.services = normalizeDictFilePath(opts.services || {})

    this.definitions = opts.definitions || {}
    this.definitions.files = (this.definitions.files || []).map(toUnix)
  }

  get typesFiles() {
    return Object.keys(this.types).map(type => this.types[type].provider)
  }

  getModelForFile(file) {
    const isNewModel = !this.model

    let start = Date.now()

    if (isNewModel) {
      logger.info(`Building ServerCode Model for path (${this.basePath})`)

      this.model = new ServerCodeModel()
      this.model.definitions.setExplicitly(this.definitions)
      this.model.loadFiles(this.basePath, null, this.typesFiles)

      logger.info(`ServerCode Model built in ${Date.now() - start}ms`)
    }

    start = Date.now()

    this.model.loadFiles(this.basePath, null, [file])

    if (this.model.errors.length) {
      throw new Error(
        `${this.model.errors[0].message}. ` +
        `This issue is caused by [${this.model.errors[0].serverCodeFile}]`
      )
    }

    const duration = Date.now() - start

    if (duration) {
      logger.debug(`ServerCode Model extended in ${Date.now() - start}ms`)
    }

    return this.model
  }

  static load(basePath) {
    const descriptorPath = path.join(basePath, DESCRIPTOR_FILE)

    if (!fs.existsSync(descriptorPath)) {
      throw new Error(`Model Descriptor not found (${descriptorPath})`)
    }

    return new ServerCodeModelDescriptor(basePath, require(descriptorPath))
  }
}

module.exports = ServerCodeModelDescriptor