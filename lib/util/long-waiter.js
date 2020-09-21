module.exports = class LongWaiter {
  constructor(checker) {
    this.checker = checker

    this.promise = new Promise(resolve => {
      this.resolve = resolve

      this.check()
    })
  }

  wait() {
    return this.promise
  }

  check() {
    if (this.checker()) {
      this.resolve()
    }
  }
}