'use strict'

/**
 * @module lib/lang/typeof
 **/

const TYPE_EXP = /^\[object (.*)\]$/
const toString = Object.prototype.toString

module.exports = function typeOf(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  const parts = TYPE_EXP.exec(toString.call(value))
  return parts[1].toLowerCase()
}


/**
 * A more accurate version of the javascript built-in function typeof
 * Date strings in ISO format are special cased to identify as `'date'`
 * @function module:lib/lang/type-of
 * @param {Any} value The javascript object to type check
 * @returns {String} The type of the object passed in
 * @example
 * typeOf([]) // 'array'
 * typeOf(/\w+/) // 'regexp'
 * @example
 * class FooBar {
 *   get [Symbol.toStringTag]() {
 *     return 'foobar'
 *   }
 * }
 * typeOf(new FooBar()) // 'foobar'
 **/
