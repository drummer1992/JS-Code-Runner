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

module.exports = {
  compactDate: compactDate
}
