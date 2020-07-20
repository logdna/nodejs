'use strict'

const {test} = require('tap')
const nock = require('nock')
const Logger = require('../lib/logger.js')
const constants = require('../lib/constants.js')
const {apiKey, createOptions} = require('./common/index.js')

nock.disableNetConnect()

test('Shorthand logging calls require options to be an object', (t) => {
  t.plan(constants.LOG_LEVELS.length)
  const logger = new Logger(apiKey)

  for (const level of constants.LOG_LEVELS) {
    const levelLowerCase = level.toLowerCase()
    const expected = `If passed, log.${levelLowerCase} requires 'options' `
      + 'to be an object'
    t.throws(() => {
      logger[levelLowerCase]('Log line', 'NOPE')
    }, {
      message: expected
    , meta: {got: 'string'}
    , name: 'TypeError'
    }, `log.${levelLowerCase} throws as expected`)
  }
})

test('timestamp validity checks', (t) => {
  t.plan(4)
  const startTime = Date.now()
  const logger = new Logger(apiKey, createOptions({
    flushIntervalMs: 10
  }))

  logger.on('warn', t.fail)
  logger.on('error', t.fail)

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls
      t.equal(payload.length, 2, 'Number of lines is correct')
      const [{timestamp: stamp1}, {timestamp: stamp2}] = payload
      t.ok(stamp1 > startTime, 'bad time format was replaced with a good one')
      t.ok(stamp2 > startTime, 'out of range time was replaced with a good one')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')
    .persist()

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'my log line'
    , lastLine: 'my log line'
    , totalLinesSent: 2
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.info('my log line', {
    timestamp: {}
  })
  logger.info('my log line', {
    timestamp: startTime + constants.MS_IN_A_DAY
  })
})

test('.log() throws if options is a string and not a valid log entry', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('error', (err) => {
    t.type(err, TypeError, 'Expected to be a TypeError')
    t.match(err, {
      name: 'TypeError'
    , message: 'If \'options\' is a string, then it must be a valid log level'
    , meta: {
        got: 'NOPE'
      , expected: constants.LOG_LEVELS
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line', 'NOPE')
})

test('.log() rejects invalid `opts` data type', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('error', (err) => {
    t.type(err, TypeError, 'Expected to be a TypeError')
    t.match(err, {
      name: 'TypeError'
    , message: 'options parameter must be a level (string), or object'
    , meta: {
        got: 'number'
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line', 12345)
})

test('.log() passed an invalid log level uses the default instead', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    level: 'info'
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const obj = body.ls[0]
      t.equal(obj.level, 'INFO', 'Default level was used instead')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('error', (err) => {
    t.type(err, Error, 'Expected to be an Error')
    t.match(err, {
      name: 'Error'
    , message: 'Invalid log level.  Using the default instead.'
    , meta: {
        got: 'NEIGH'
      , expected: constants.LOG_LEVELS
      , used: logger.level
      }
    }, 'Expected Error is correct')
  })
  logger.log('log line', {level: 'NEIGH'})
})

test('.log() ignores empty or null messages', (t) => {
  t.plan(6)

  const logger = new Logger(apiKey, createOptions())
  const expected = [null, undefined, '']

  logger.on('warn', (obj) => {
    t.match(obj, {
      message: 'Log statement was empty.  Ignored'
    }, `Got warning for ${obj.statement}`)
    t.ok(expected.includes(obj.statement), 'statement property is correct')
  })

  logger.log(null)
  logger.log(undefined)
  logger.log('')
})

test('removeMetaProperty emits \'warn\' if property is not found', (t) => {
  t.plan(1)
  const logger = new Logger(apiKey)

  logger.on('removeMetaProperty', t.fail)
  logger.on('warn', (obj) => {
    t.deepEqual(obj, {
      message: 'Property is not an existing meta property.  Cannot remove.'
    , key: 'NOPE'
    }, 'Got expected warning')
  })
  logger.removeMetaProperty('NOPE')
})

test('HTTP timeout will emit Error and continue to retry', (t) => {
  const delay = 1000 // Set this low since nock will ultimately wait to timeout
  const logger = new Logger(apiKey, createOptions({
    baseBackoffMs: 100
  , maxBackoffMs: 500
  , timeout: delay
  }))
  let attempts = 0

  t.on('end', async () => {
    nock.cleanAll()
  })

  // Fail 3 times, then succeed. FYI, the axios agent treats a timeout on connection
  // the same as a timeout on response body (connection accepted; no reply)
  nock(logger.url)
    .post('/', () => {
      t.equal(
        logger[Symbol.for('isLoggingBackedOff')]
      , false
      , 'Logger is not backed off prior to the first failure'
      )
      return true
    })
    .query(() => { return true })
    .delayConnection(delay + 1)
    .reply(200, 'Will Not Happen')
    .post('/', () => {
      t.equal(
        logger[Symbol.for('isLoggingBackedOff')]
      , true
      , 'Logger is backed off'
      )
      return true
    })
    .query(() => { return true })
    .delayConnection(delay + 1)
    .reply(200, 'Will Not Happen')
    .post('/', () => { return true })
    .query(() => { return true })
    .delayConnection(delay + 1)
    .reply(200, 'Will Not Happen')
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Success')

  logger.on('error', (err) => {
    t.type(err, Error, 'Error type is emitted')
    t.match(err, {
      message: 'An error occured while sending logs to the cloud.'
    , meta: {
        actual: `timeout of ${delay}ms exceeded`
      , code: 'ECONNABORTED'
      , firstLine: 'This will cause an HTTP timeout'
      , lastLine: null
      , retrying: true
      , attempts: ++attempts
      }
    }, `Error properties are correct for attempt ${attempts}`)
  })

  logger.on('cleared', ({message}) => {
    t.equal(message, 'All accumulated log entries have been sent', 'cleared msg')
    t.equal(
      logger[Symbol.for('isLoggingBackedOff')]
    , false
    , 'Logger is not backed off after having a successful connection'
    )
    t.end()
  })

  logger.log('This will cause an HTTP timeout')
})

test('A 500-error will continue to retry', (t) => {
  const logger = new Logger(apiKey, createOptions({
    baseBackoffMs: 100
  , maxBackoffMs: 500
  }))
  let attempts = 0

  t.on('end', async () => {
    nock.cleanAll()
  })

  // Fail 3 times, then succeed
  nock(logger.url)
    .post('/', () => {
      t.equal(
        logger[Symbol.for('isLoggingBackedOff')]
      , false
      , 'Logger is not backed off prior to the first failure'
      )
      return true
    })
    .query(() => { return true })
    .reply(500, 'SERVER KABOOM')
    .post('/', () => {
      t.equal(
        logger[Symbol.for('isLoggingBackedOff')]
      , true
      , 'Logger is backed off'
      )
      return true
    })
    .query(() => { return true })
    .reply(500, 'SERVER KABOOM')
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(500, 'SERVER KABOOM')
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Success')

  logger.on('error', (err) => {
    t.type(err, Error, 'Error type is emitted')
    t.match(err, {
      message: 'An error occured while sending logs to the cloud.'
    , meta: {
        actual: 'Request failed with status code 500'
      , code: 500
      , firstLine: 'This will cause an HTTP timeout'
      , lastLine: null
      , retrying: true
      , attempts: ++attempts
      }
    }, `Error properties are correct for attempt ${attempts}`)
  })

  logger.on('cleared', ({message}) => {
    t.equal(message, 'All accumulated log entries have been sent', 'cleared msg')
    t.equal(
      logger[Symbol.for('isLoggingBackedOff')]
    , false
    , 'Logger is not backed off after having a successful connection'
    )
    t.end()
  })

  logger.log('This will cause an HTTP timeout')
})

test('User-level errors are discarded after emitting an error', (t) => {
  const logger = new Logger(apiKey, createOptions({
    flushLimit: 10 // one message per buffer
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', () => {
      t.equal(
        logger[Symbol.for('isLoggingBackedOff')]
      , false
      , 'User errors did not cause logger to back off'
      )
      return true
    })
    .query(() => { return true })
    .reply(400, {
      error: 'Nope, your line was invlalid somehow'
    })
    .persist()

  logger.on('error', (err) => {
    t.type(err, Error, 'Error type is emitted')
    t.match(err, {
      message: 'An error occured while sending logs to the cloud.'
    , meta: {
        actual: 'Request failed with status code 400'
      , code: 400
      , firstLine: /^Something/
      , lastLine: null
      , retrying: false
      , attempts: 1
      }
    }, 'Error properties are correct for a user error')
  })

  logger.on('cleared', ({message}) => {
    t.equal(message, 'All accumulated log entries have been sent', 'cleared msg')
    t.equal(logger[Symbol.for('isSending')], false, 'no longer sending')
    t.equal(logger[Symbol.for('totalLinesReady')], 0, 'no more lines ready')
    t.deepEqual(logger[Symbol.for('readyToSend')], [], 'send buffer is empty')
    t.end()
  })

  logger.log('Something is invalid about this line')
  logger.log('Something else is wrong with this line too')
})
