'use strict'

async function confirmation(msg) {
  const answer = (await prompt(msg) || '').toUpperCase()

  if (answer === 'Y' || answer === 'YES') {
    return true
  }

  if (answer === 'N' || answer === 'NO') {
    return false
  }
}

function prompt(message) {
  const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout })

  return new Promise((resolve) => {
    rl.question(message, (value) => {
      rl.close()
      resolve(value)
    })
  })
}

function mergeObjects(target, source) {
  const result = {}

  const keys = Object.keys(target).concat(Object.keys(source)).reduce((memo, key) => {
    if (memo.indexOf(key)) {
      memo.push(key)
    }

    return memo
  }, [])

  keys.forEach(key => {
    const isTargetValueObject = isObject(target[key])
    const isSourceValueObject = isObject(source[key])

    if (isTargetValueObject && isSourceValueObject) {
      result[key] = mergeObjects(target[key], source[key])

    } else if (isTargetValueObject) {
      result[key] = target[key]

    } else if (isSourceValueObject || isUndefined(target[key])) {
      result[key] = source[key]

    } else {
      result[key] = target[key]
    }
  })

  return result
}

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isUndefined(value) {
  return typeof value === 'undefined'
}

function ensureObject(value) {
  return isObject(value) ? value : {}
}

exports.mergeObjects = mergeObjects
exports.ensureObject = ensureObject
exports.isObject = isObject
exports.isUndefined = isUndefined

exports.prompt = prompt
exports.confirmation = confirmation