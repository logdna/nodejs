'use strict'

const {test, threw} = require('tap')
const typeOf = require('../../../lib/lang/type-of.js')

class FooBar {
  get [Symbol.toStringTag]() {
    return 'FooBar'
  }
}

test('typeOf', (t) => {
  t.type(typeOf, 'function', 'typeOf is a function')
  const cases = [
    {
      value: ''
    , expected: 'string'
    }
  , {
      value: new Date()
    , expected: 'date'
    }
  , {
      value: null
    , expected: 'null'
    }
  , {
      value: undefined
    , expected: 'undefined'
    }
  , {
      value: 1.1
    , expected: 'number'
    }
  , {
      value: /\w+/
    , expected: 'regexp'
    }
  , {
      value: new FooBar()
    , expected: 'foobar'
    }
  , {
      value: new Set()
    , expected: 'set'
    }
  , {
      value: [1, 2]
    , expected: 'array'
    }
  , {
      value: {}
    , expected: 'object'
    }
  , {
      value: true
    , expected: 'boolean'
    }
  , {
      value: () => {}
    , expected: 'function'
    }
  ]
  for (const current of cases) {
    t.equal(
      typeOf(current.value)
    , current.expected
    , current.message || `typeOf(${current.value}) == ${current.expected}`
    )
  }
  t.end()
}).catch(threw)
