'use strict'

const {test} = require('tap')
const {flushAll, cleanUpAll, Logger} = require('../lib/logger.js')
const {apiKey, createOptions} = require('./common/index.js')

test('cleanUpAll calls flush for multiple loggers', (t) => {
  t.plan(4)
  const logger1 = new Logger(apiKey, createOptions())
  const logger2 = new Logger(apiKey, createOptions())
  const logger3 = new Logger(apiKey, createOptions())

  const flush1 = logger1._flush
  const flush2 = logger2._flush
  const flush3 = logger3._flush

  t.on('end', async () => {
    logger1._flush = flush1
    logger2._flush = flush2
    logger3._flush = flush3
  })

  logger1._flush = (cb) => {
    t.pass('_flush called for logger 1')
    cb()
  }
  logger2._flush = (cb) => {
    t.pass('_flush called for logger 2')
    cb()
  }
  logger3._flush = (cb) => {
    t.pass('_flush called for logger 3')
    cb()
  }
  cleanUpAll((err) => {
    t.error(err, 'No error returned')
  })
})

test('flushAll assigns a default callback if one isn\'t provided', (t) => {
  t.plan(3)
  const logger1 = new Logger(apiKey, createOptions())
  const logger2 = new Logger(apiKey, createOptions())
  const logger3 = new Logger(apiKey, createOptions())

  const flush1 = logger1._flush
  const flush2 = logger2._flush
  const flush3 = logger3._flush

  t.on('end', async () => {
    logger1._flush = flush1
    logger2._flush = flush2
    logger3._flush = flush3
  })

  logger1._flush = (cb) => {
    t.pass('_flush called for logger 1')
    cb()
  }
  logger2._flush = (cb) => {
    t.pass('_flush called for logger 2')
    cb()
  }
  logger3._flush = (cb) => {
    t.pass('_flush called for logger 3')
    cb()
  }
  flushAll()
})

test('cleanUpAll property sends back errors', (t) => {
  const logger1 = new Logger(apiKey, createOptions())
  const logger2 = new Logger(apiKey, createOptions())
  const logger3 = new Logger(apiKey, createOptions())

  const flush1 = logger1._flush
  const flush2 = logger2._flush
  const flush3 = logger3._flush

  t.on('end', async () => {
    logger1._flush = flush1
    logger2._flush = flush2
    logger3._flush = flush3
  })

  logger1._flush = (cb) => {
    const err = new Error('problem in logger1')
    cb(err)
  }
  logger2._flush = (cb) => {
    const err = new Error('problem in logger2')
    cb(err)
  }
  logger3._flush = (cb) => {
    const err = new Error('problem in logger3')
    cb(err)
  }
  cleanUpAll((err) => {
    const expected = 'The following errors happened while flushing all loggers: '
      + 'Error: problem in logger1,'
      + 'Error: problem in logger2,'
      + 'Error: problem in logger3'

    t.ok(err, 'Errors were passed back')
    t.equal(err, expected, 'Error message is correct')
    t.end()
  })
})
