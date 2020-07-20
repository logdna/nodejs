'use strict'

const {test} = require('tap')
const index = require('../index.js')
const {apiKey, createOptions} = require('./common/index.js')

test('Index exports are correct', async (t) => {
  t.equal(Object.keys(index).length, 2, 'property count is correct')
  t.match(index, {
    createLogger: Function
  , setupDefaultLogger: Function
  }, 'Exported properties are correct')
})

test('setupDefaultLogger', async (t) => {
  t.test('Create the singleton', async (tt) => {
    const instance = index.setupDefaultLogger(
      apiKey
    , createOptions({
        app: 'MyDefaultApp'
      })
    )
    tt.equal(instance.constructor.name, 'Logger', 'Returned an instance')
    tt.equal(instance.app, 'MyDefaultApp', 'App name is correct')
  })

  t.test('Singleton is returned', async (tt) => {
    const instance = index.setupDefaultLogger(
      apiKey
    , createOptions({
        app: 'ThisWillNotWork'
      })
    )
    tt.equal(instance.constructor.name, 'Logger', 'Returned an instance')
    tt.equal(instance.app, 'MyDefaultApp', 'App name is correct')
  })
})

test('createLogger instantiates a Logger instance correctly', async (t) => {
  const log = index.createLogger(apiKey, createOptions())
  t.equal(log.constructor.name, 'Logger', 'instance returned')
})
