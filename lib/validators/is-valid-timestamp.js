'use strict'

const constants = require('../constants.js')

module.exports = function isValidTimestamp(timestamp) {
  const date = new Date(timestamp)
  if (isNaN(date) || Math.abs(timestamp - Date.now()) > constants.MS_IN_A_DAY) {
    return false
  }
  return true
}
