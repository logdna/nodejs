'use strict'

const constants = require('../constants.js')

module.exports = function checkStringParam(param, name) {
  if (!param || typeof param !== 'string') {
    throw new TypeError(`${name} is undefined or not passed as a String`)
  }
  if (param.length > constants.MAX_INPUT_LENGTH) {
    throw new TypeError(
      `${name} cannot be longer than ${constants.MAX_INPUT_LENGTH} chars`
    )
  }
}
