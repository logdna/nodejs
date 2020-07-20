'use strict'

const {test} = require('tap')
const stringify = require('json-stringify-safe')
const nock = require('nock')
const Logger = require('../lib/logger.js')
const constants = require('../lib/constants.js')
const {apiKey, createOptions} = require('./common/index.js')

nock.disableNetConnect()

test('Test all log levels, including send events', async (t) => {
  const opts = createOptions({
    app: 'myApp'
  })
  const logger = new Logger(apiKey, opts)
  const logText = 'This is my log text'
  const responseText = 'This is the ingester response'

  for (const LEVEL of constants.LOG_LEVELS) {
    const level = LEVEL.toLowerCase()

    t.test(`Calling with log.${level}`, (tt) => {
      tt.plan(7)
      tt.on('end', async () => {
        logger.removeAllListeners()
        nock.cleanAll()
      })

      const scope = nock(opts.url)
        .post('/', (body) => {
          const numProps = Object.keys(body).length
          tt.equal(numProps, 2, 'Number of request body properties')
          tt.match(body, {
            e: 'ls'
          , ls: [
              {
                timestamp: Number
              , line: logText
              , level: LEVEL
              , app: opts.app
              , meta: '{}'
              }
            ]
          })
          tt.equal(body.ls.length, 1, 'log line count')
          return true
        })
        .query((qs) => {
          tt.match(qs, {
            hostname: opts.hostname
          , mac: opts.mac
          , ip: opts.ip
          , tags: ''
          , now: /^\d+$/
          }, 'Querystring properties look correct')
          return true
        })
        .reply(200, responseText)

      logger.on('send', (obj) => {
        tt.deepEqual(obj, {
          httpStatus: 200
        , firstLine: logText
        , lastLine: null
        , totalLinesSent: 1
        , totalLinesReady: 0
        , bufferCount: 0
        }, 'Got send event')
      })
      logger.on('cleared', (obj) => {
        tt.deepEqual(obj, {
          message: 'All accumulated log entries have been sent'
        }, 'Got cleared event')
        tt.ok(scope.isDone(), 'Nock intercepted the http call')
      })
      logger[level](logText)
    })
  }
})

test('Using an https:// url sends and https agent', (t) => {
  const logger = new Logger(apiKey, createOptions({
    url: 'https://localhost:8888'
  }))
  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.line, 'This is over HTTPS', 'Log text was passed in body')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'This is over HTTPS'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.log('This is over HTTPS')
})

test('log() can be called by itself without using a level shortcut', (t) => {
  t.plan(4)
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.line, 'Hi there', 'Log text was passed in body')
      t.equal(payload.level, 'INFO', 'Default level was used')
      return true
    })
    .query((qs) => {
      t.pass('Intercepted query string')
      return true
    })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Hi there'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.log('Hi there')
})

test('log() will work with falsey log lines, other than null/empty/undef', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    flushIntervalMs: 10 // Make SURE they're sent in the same batch
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const lines = body.ls.map((obj) => { return obj.line })
      t.deepEqual(lines, ['0', 'false'], 'Request payload is correct')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')
    .persist()

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: '0'
    , lastLine: 'false'
    , totalLinesSent: 2
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.log(0)
  logger.log(false)
})

test('log() can be passed an object to log, and serialization is "safe"', (t) => {
  const logger = new Logger(apiKey, createOptions())
  // json-stringify-safe allows circular refs
  const circularObj = {key: 'val'}
  circularObj.circularRef = circularObj
  circularObj.list = [circularObj, circularObj]
  const expected = stringify(circularObj)

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const line = body.ls[0].line
      t.equal(line, expected, 'Object was serialized safely')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: expected
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    })
  }, 'Got send event')
  logger.info(circularObj)
})

test('log() can be called with level (case insensitive) as an opts string', (t) => {
  const logger = new Logger(apiKey, createOptions())
  const myLevel = 'DebuG'

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.level, 'DEBUG', 'Level is correct')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Hi there'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    })
  }, 'Got send event')
  logger.log('Hi there', myLevel)
})

test('Call log() using an options object', (t) => {
  const logger = new Logger(apiKey, createOptions({
    app: 'MyApp'
  }))
  const myText = 'Hello there, I am logging'
  const timestamp = Date.now()
  const opts = {
    timestamp
  , level: 'trAcE'
  , meta: {
      myKey: 'myValue'
    }
  , logSourceCRN: 'some_logsource'
  , saveServiceCopy: true
  , appOverride: 'newApp'
  , context: {}
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload, {
        timestamp
      , line: myText
      , level: 'TRACE'
      , app: 'MyApp'
      , meta: JSON.stringify(opts.meta)
      , logSourceCRN: 'some_logsource'
      , saveServiceCopy: true
      , appOverride: 'newApp'
      }, 'Options were successfully placed into the message')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: myText
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.log(myText, opts)
})

test('Using global meta in combination with per-message meta', (t) => {
  const logger = new Logger(apiKey, createOptions({
    meta: {
      one: 1
    , two: 2
    , three: 3
    }
  }))
  const opts = {
    meta: {
      two: 'TWO'
    }
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      const expectedMeta = {
        one: 1
      , two: 'TWO'
      , three: 3
      }
      t.equal(
        payload.meta
      , JSON.stringify(expectedMeta)
      , 'per-message meta was merged with global meta'
      )
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Hi'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.trace('Hi', opts)
})

test('Using opts.context will replace opts.meta', (t) => {
  const logger = new Logger(apiKey, createOptions())
  const opts = {
    context: {
      hello: 'there'
    }
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.meta, JSON.stringify(opts.context), 'Context replaced meta')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Hi'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.trace('Hi', opts)
})

test('opts.context is ignored when it\'s not an object', (t) => {
  const logger = new Logger(apiKey, createOptions())
  logger.addMetaProperty('inMeta', true)
  const opts = {
    context: 'NOPE'
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.meta, JSON.stringify({inMeta: true}), 'Context ignored')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Hi'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.trace('Hi', opts)
})

test('Using opts.indexMeta will not stringify the meta data', (t) => {
  const logger = new Logger(apiKey, createOptions())
  const opts = {
    indexMeta: true
  , meta: {
      luke: 'skywalker'
    }
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, opts.meta, 'Meta is an object')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.log('Howdy, folks!', opts)
})

test('indexMeta on at constructor keeps meta as an object', (t) => {
  const logger = new Logger(apiKey, createOptions({
    indexMeta: true
  }))

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, {}, 'Meta is an object')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Hey there'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.log('Hey there', null)
})

test('Using _index_meta will not stringify the meta data', (t) => {
  const logger = new Logger(apiKey, createOptions({
    indexMeta: true
  }))
  const opts = {
    meta: {
      luke: 'skywalker'
    }
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, opts.meta, 'Meta is an object')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.trace('Howdy, folks!', opts)
})

test('Shim properties are put into the meta', (t) => {
  const logger = new Logger(apiKey, createOptions({
    shimProperties: ['one', 'two', 'three', 'four']
  , app: 'theBestApp'
  }))
  const timestamp = Date.now()
  const opts = {
    one: 1
  , two: 2
  , three: 3
  , ignored: 'yes'
  , timestamp
  }

  t.plan(2)
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload, {
        timestamp
      , line: 'Howdy, folks!'
      , level: 'WARN'
      , app: 'theBestApp'
      , meta: '{}'
      , one: 1
      , two: 2
      , three: 3
      }, 'Message payload is correct')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })
  logger.warn('Howdy, folks!', opts)
})

test('addMetaProperty() adds it to each message; indexMeta: true', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    indexMeta: true
  }))

  logger.on('addMetaProperty', (obj) => {
    t.deepEqual(obj, {
      message: 'Successfully added meta property'
    , key: 'metaProp'
    , value: 'metaVal'
    }, 'Got addMetaProperty event')
  })

  logger.addMetaProperty('metaProp', 'metaVal')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, {
        metaProp: 'metaVal'
      }, 'meta property injected into message payload')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.warn('Howdy, folks!')
})

test('addMetaProperty() adds it to each message; indexMeta: false', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    indexMeta: false
  }))

  logger.on('addMetaProperty', (obj) => {
    t.deepEqual(obj, {
      message: 'Successfully added meta property'
    , key: 'metaProp'
    , value: 'metaVal'
    }, 'Got addMetaProperty event')
  })

  logger.addMetaProperty('metaProp', 'metaVal')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(
        payload.meta
      , '{"metaProp":"metaVal"}'
      , 'meta property injected into message payload'
      )
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.warn('Howdy, folks!')
})

test('removeMetaProperty() removes it from the payload; indexMeta: true', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    indexMeta: true
  }))

  logger.on('removeMetaProperty', (obj) => {
    t.deepEqual(obj, {
      message: 'Successfully removed meta property'
    , key: 'two'
    }, 'Got removeMetaProperty event')
  })

  logger.addMetaProperty('one', 1)
  logger.addMetaProperty('two', 2)
  logger.addMetaProperty('three', 3)
  logger.removeMetaProperty('two')

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, {
        one: 1
      , three: 3
      }, 'meta property was removed from the message payload')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.warn('Howdy, folks!')
})

test('removeMetaProperty() removes it from the payload; indexMeta: false', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    indexMeta: false
  }))

  logger.on('removeMetaProperty', (obj) => {
    t.deepEqual(obj, {
      message: 'Successfully removed meta property'
    , key: 'two'
    }, 'Got removeMetaProperty event')
  })

  logger.addMetaProperty('one', 1)
  logger.addMetaProperty('two', 2)
  logger.addMetaProperty('three', 3)
  logger.removeMetaProperty('two')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.meta
      , '{"one":1,"three":3}'
      , 'meta property was removed from the message payload'
      )
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Howdy, folks!'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.warn('Howdy, folks!')
})

test('Can call .log with HTTP (not https)', (t) => {
  t.plan(2)
  const logger = new Logger(apiKey, createOptions({
    protocol: 'http'
  }))
  t.equal(logger[Symbol.for('requestDefaults')].useHttps, false, 'HTTPS is off')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'This is not secure'
    , lastLine: null
    , totalLinesSent: 1
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.warn('This is not secure')
})

test('Flushing on a timer includes multiple lines', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions({
    flushIntervalMs: 1000
  }))
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger.url)
    .post('/', (body) => {
      const payload = body.ls
      t.equal(payload.length, 3, 'Payload has the right number of entries')
      t.match(payload, [
        {
          timestamp: Number
        , line: 'Line 1'
        , level: 'INFO'
        , app: logger.app
        , meta: '{}'
        }
      , {
          timestamp: Number
        , line: 'Line 2'
        , level: 'INFO'
        , app: logger.app
        , meta: '{}'
        }
      , {
          timestamp: Number
        , line: 'Line 3'
        , level: 'INFO'
        , app: logger.app
        , meta: '{}'
        }
      ])
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.on('send', (obj) => {
    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: 'Line 1'
    , lastLine: 'Line 3'
    , totalLinesSent: 3
    , totalLinesReady: 0
    , bufferCount: 0
    }, 'Got send event')
  })

  logger.info('Line 1')
  logger.info('Line 2')
  logger.info('Line 3')
})

test('Immediately sends if byte size > flush byte limit', (t) => {
  t.plan(5) // 3x 'send' + 'cleared'
  let sendCount = 0
  const then = Date.now()

  t.on('end', async () => {
    nock.cleanAll()
  })
  const logger = new Logger(apiKey, createOptions({
    flushLimit: 10
  , flushIntervalMs: 5000 // It should ignore this and flush immediately
  }))

  nock(logger.url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')
    .persist()

  const line = 'Hi, this is my line longer than 10 bytes'

  logger.on('send', (obj) => {
    const totalLinesSent = 1
    let totalLinesReady
    let bufferCount

    switch (++sendCount) {
      case 1:
        totalLinesReady = 2
        bufferCount = 2
        break
      case 2:
        totalLinesReady = 1
        bufferCount = 1
        break
      case 3:
        totalLinesReady = 0
        bufferCount = 0
        break
    }

    t.deepEqual(obj, {
      httpStatus: 200
    , firstLine: line
    , lastLine: null
    , totalLinesSent
    , totalLinesReady
    , bufferCount
    }, 'Expected send event received')
  })

  logger.on('cleared', (obj) => {
    t.deepEqual(obj, {
      message: 'All accumulated log entries have been sent'
    }, 'Expected \'cleared\' event')
    const now = Date.now()
    t.ok(now - then < 5000, 'flush interval was ignored; Logs sent immediately')
  })

  logger.info(line)
  logger.info(line)
  logger.info(line)
})

test('flush() can be called any time, and always emits \'cleared\'', (t) => {
  t.plan(3)
  const logger = new Logger(apiKey, createOptions())

  logger.on('cleared', ({message}) => {
    t.equal(message, 'All buffers clear; Nothing to send', 'Got cleared event')
  })

  logger.flush()
  logger.flush()
  logger.flush()
})
