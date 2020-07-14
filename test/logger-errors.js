'use strict'

const {test} = require('tap')
const nock = require('nock')
const {Logger} = require('../lib/logger.js')
const configs = require('../lib/configs.js')
const {apiKey, createOptions} = require('./common/index.js')

nock.disableNetConnect()

test('timestamp validity checks', async (t) => {
  const startTime = Date.now()
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger._url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')
    .persist()

  t.test('timestamp format is not correct', (tt) => {
    logger.info('my log line', {
      timestamp: {}
    }, (err, res) => {
      tt.error(err, 'Error was not returned')
      tt.deepEqual(res.lines, ['my log line'], 'Log entry was accepted')
      const data = JSON.parse(res.body.config.data)
      const payload = data.ls[0]
      tt.ok(payload.timestamp > startTime, 'Bad time was replaced with a good time')
      tt.end()
    })
  })

  t.test('timestamp is out of range', (tt) => {
    logger.info('my log line', {
      timestamp: startTime + configs.MS_IN_A_DAY
    }, (err, res) => {
      tt.error(err, 'Error was not returned')
      tt.deepEqual(res.lines, ['my log line'], 'Log entry was accepted')
      const data = JSON.parse(res.body.config.data)
      const payload = data.ls[0]
      tt.ok(payload.timestamp > startTime, 'Bad time was replaced with a good time')
      tt.end()
    })
  })
})

test('.log() truncates long opts strings', (t) => {
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger._url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.log('log line', 'x'.repeat(configs.MAX_INPUT_LENGTH + 1), (err, res) => {
    // This test should actually throw due to an invalid level string.  Fix later.
    t.error(err, 'No error')
    t.end()
  })
})

test('.log() rejects invalid `opts` data type', (t) => {
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger._url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.log('log line', 12345, (err, res) => {
    t.type(err, Error, 'Error was returned')
    t.equal(
      err.message
    , 'options parameter must be a level (string), or object'
    , 'Error message is correct'
    )
    t.deepEqual(err.meta, {opts: 12345}, 'Meta is set on the error')
    t.end()
  })
})

test('_bufferLog() error handling', async (t) => {
  t.test('Ignores null message', (tt) => {
    const logger = new Logger(apiKey, createOptions())
    logger._bufferLog(null, (err, body) => {
      tt.error(err, 'No error')
      tt.deepEqual(body, undefined, 'No error, but nothing was done either')
      tt.end()
    })
  })

  t.test('Ignores empty object', (tt) => {
    const logger = new Logger(apiKey, createOptions())
    logger._bufferLog({}, (err, body) => {
      tt.error(err, 'No error')
      tt.deepEqual(body, undefined, 'No error, but nothing was done either')
      tt.end()
    })
  })

  t.test('Truncates messages that are too long', (tt) => {
    tt.on('end', async () => {
      nock.cleanAll()
    })
    const logger = new Logger(apiKey, createOptions())

    nock(logger._url)
      .post('/', () => { return true })
      .query(() => { return true })
      .reply(200, 'Ingester response')

    const longData = 'x'.repeat(configs.MAX_LINE_LENGTH)
    logger._bufferLog({line: longData + 'EXTRA'}, (err, res) => {
      tt.error(err, 'No error')
      const expected = [longData + ' (cut off, too long...)']
      tt.deepEqual(res.lines, expected, 'Long line was truncated')
      tt.end()
    })
  })

  t.test('Ignores messages whose byte length exceeds the buffer size', (tt) => {
    tt.on('end', async () => {
      nock.cleanAll()
    })
    const logger = new Logger(apiKey, createOptions({
      failedBufRetentionLimit: 10
    }))

    nock(logger._url)
      .post('/', () => { return true })
      .query(() => { return true })
      .reply(200, 'Ingester response')

    const longData = 'x'.repeat(50)
    logger._bufferLog({line: longData}, (err, res) => {
      tt.error(err, 'No error')
      tt.notOk(res, 'Line was ignored, no response sent back')
      tt.end()
    })
  })

  t.test('Immediately sends if byte size > flush byte limit', (tt) => {
    tt.on('end', async () => {
      nock.cleanAll()
    })
    const logger = new Logger(apiKey, createOptions({
      flushLimit: 10
    , flushInterval: 5000 // It should ignore this and flush immediately
    }))

    nock(logger._url)
      .post('/', () => { return true })
      .query(() => { return true })
      .reply(200, 'Ingester response')

    const line = 'Hi, this is my line longer than 10 bytes'
    logger._bufferLog({line}, (err, res) => {
      tt.error(err, 'No error')
      const expected = [line]
      tt.deepEqual(res.lines, expected, 'Lines were flushed')
      tt.end()
    })
  })

  t.test('_isLoggingBackedOff schedules flush with a retry delay', (tt) => {
    tt.on('end', async () => {
      nock.cleanAll()
    })
    const retryTimeout = 1000
    const logger = new Logger(apiKey, createOptions({
      retryTimeout
    }))
    logger._isLoggingBackedOff = true // Normally NOT set this way

    nock(logger._url)
      .post('/', () => { return true })
      .query(() => { return true })
      .reply(200, 'Ingester response')

    const line = 'Some log line'
    const startTime = Date.now()
    logger._bufferLog({line}, (err, res) => {
      tt.error(err, 'No error')
      const expected = [line]
      tt.deepEqual(res.lines, expected, 'Lines were flushed')
      tt.equal(logger._isLoggingBackedOff, false, 'Backoff Boolean was reset')
      const diff = Date.now() - startTime
      tt.ok(diff > retryTimeout, 'Retry timeout kicked in before flushing')
      tt.end()
    })
  })
})

test('removeMetaProperty throws if property is not found', async (t) => {
  const logger = new Logger(apiKey)
  t.throws(() => {
    logger.removeMetaProperty('NOPE')
  }, {
    message: 'There is no meta property called NOPE'
  }, 'Expected error was thrown')
})

test('_flush expects a callback', async (t) => {
  const logger = new Logger(apiKey)
  t.throws(() => {
    logger._flush('NOPE')
  }, {
    message: 'flush function expects a callback'
  }, 'Expected error was thrown')
})

test('Handles HTTP errors from POST request', (t) => {
  t.plan(3)
  t.on('end', async () => {
    nock.cleanAll()
  })
  const logger = new Logger(apiKey, createOptions({
    retryTimes: 2
  , retryTimeout: 100
  }))

  nock(logger._url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(500, 'NOPE')
    .persist()

  const expectedErr = 'An error occured while making the request. '
    + 'Response status code: 500 null'
  let count = 0

  logger.log('This will not work', (err) => {
    t.equal(err, expectedErr, `Error ${++count} received as expected`)
  })
})

test('Non-200 status codes return an error', (t) => {
  t.on('end', async () => {
    nock.cleanAll()
  })
  const logger = new Logger(apiKey, createOptions())

  nock(logger._url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(204, 'STRANGE')

  const expectedErr = 'Unsuccessful request. Status text: null'

  logger.log('Hey! This will produce non-200 error', (err) => {
    t.equal(err, expectedErr, 'Error message is as expected')
    t.end()
  })
})
