'use strict'

// Checks for a property's existence in an object.  If `mustHaveValue`
// is true, then has() will also expect that the value is not null or undefined.

module.exports = function has(obj, prop) {
  const exists = Object.prototype.hasOwnProperty.call(obj, prop)
  if (!exists) return false
  if (obj[prop] === undefined || obj[prop] === null) return false

  return true
}
