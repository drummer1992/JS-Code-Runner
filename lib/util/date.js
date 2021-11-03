'use strict'

function zeroPad(n, size) {
  n = n.toString()

  while (n.length < size) {
    n = `0${n}`
  }

  return n
}

// new Date() => 16:19:34.754
function compactDate(d) {
  const time = [
    zeroPad(d.getHours(), 2),
    zeroPad(d.getMinutes(), 2),
    zeroPad(d.getSeconds(), 2)
  ].join(':')

  return [time, zeroPad(d.getMilliseconds(), 3)].join('.')
}

function hrtime() {
  const time = process.hrtime()

  return function slice() {
    const duration = process.hrtime(time)
    const lastIndex = duration.length - 1
    const ms = duration[lastIndex - 1] * 1000 + duration[lastIndex] / 1e6

    return ms.toFixed(3)
  }
}

module.exports = {
  compactDate: compactDate,
  hrtime     : hrtime,
}
