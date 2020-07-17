'use strict'

const {test} = require('tap')
const nock = require('nock')
const {Logger} = require('../lib/logger.js')
const configs = require('../lib/configs.js')
const {apiKey, createOptions} = require('./common/index.js')

nock.disableNetConnect()

test('Test all log levels using a callback', async (t) => {
  const opts = createOptions({
    app: 'myApp'
  })
  const log = new Logger(apiKey, opts)
  const logText = 'This is my log text'
  const responseText = 'This is the ingester response'

  for (const LEVEL of configs.LOG_LEVELS) {
    const level = LEVEL.toLowerCase()

    t.test(`Calling with log.${level}`, (tt) => {
      tt.on('end', async () => {
        nock.cleanAll()
      })

      const scope = nock(opts.logdna_url)
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
              , meta: {}
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

      log[level](logText, (err, res) => {
        tt.error(err)
        tt.match(res, {
          lines: [logText]
        , httpStatus: 200
        , body: {
            status: 200
          , headers: {}
          , config: Object
          , request: Object
          , data: responseText
          }
        }, 'Callback received the correct response')
        tt.ok(scope.isDone(), 'Nock intercepted the http call')
        tt.end()
      })
    })
  }
})

test('.log() can be called by itself without a callback', (t) => {
  t.plan(4)
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger._url)
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

  t.doesNotThrow(() => {
    logger.log('Hi there')
  }, 'Should not throw if .log() is called without a callback')
})

test('.log() can be called by itself with callback in place of opts', (t) => {
  const logger = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.line, 'Hi there', 'Log text was passed in body')
      t.equal(payload.level, 'INFO', 'Default level was used')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.log('Hi there', (err, res) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('.log() can be passed an object to log', (t) => {
  const log = new Logger(apiKey, createOptions())

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const line = body.ls[0].line
      t.equal(line, '{\n  "some": "test"\n}', 'Object was serialized pretty')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  log.info({some: 'test'}, (err, body) => {
    t.error(err, 'No error returned')
    t.deepEqual(body.lines, ['{\n  "some": "test"\n}'], 'Line returned correctly')
    t.end()
  })
})

test('.log() can be called with level as an opts string', (t) => {
  const logger = new Logger(apiKey, createOptions())
  const myLevel = 'DEBUG'

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(logger._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.level, myLevel, 'Level is correct')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  logger.log('Hi there', 'DEBUG', (err, res) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Call .log using an options object', (t) => {
  const log = new Logger(apiKey, createOptions({
    app: 'MyApp'
  }))
  const myText = 'Hello there, I am logging'
  const timestamp = Date.now()
  const opts = {
    timestamp
  , meta: {
      myKey: 'myValue'
    }
  , logSourceCRN: 'some_logsource'
  , saveServiceCopy: true
  , appOverride: 'newApp'
  , context: {}
  }

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
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


  log.trace(myText, opts, (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Using opts.context will replace opts.meta', (t) => {
  const log = new Logger(apiKey, createOptions())
  const opts = {
    context: {
      hello: 'there'
    }
  }

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.equal(payload.meta, JSON.stringify(opts.context), 'Context replaced meta')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.trace('Hi', opts, (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Using opts.index_meta will not stringify the meta data', (t) => {
  const log = new Logger(apiKey, createOptions())
  const opts = {
    index_meta: true
  , meta: {
      luke: 'skywalker'
    }
  }

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, opts.meta, 'Meta is an object')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.log('Howdy, folks!', opts, (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('index_meta on at constructor keeps meta as an object', (t) => {
  const log = new Logger(apiKey, createOptions({
    index_meta: true
  }))

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, {}, 'Meta is an object')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')

  log.log('Hey there', null, (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Using _index_meta will not stringify the meta data', (t) => {
  const log = new Logger(apiKey, createOptions({
    index_meta: true
  }))
  const opts = {
    meta: {
      luke: 'skywalker'
    }
  }

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, opts.meta, 'Meta is an object')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.trace('Howdy, folks!', opts, (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Shim properties are put into the meta', (t) => {
  const log = new Logger(apiKey, createOptions({
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

  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload, {
        timestamp
      , line: 'Howdy, folks!'
      , level: 'WARN'
      , app: 'theBestApp'
      , meta: {}
      , one: 1
      , two: 2
      , three: 3
      }, 'Message payload is correct')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.warn('Howdy, folks!', opts, (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('log.addMetaProperty adds it to each message', (t) => {
  const log = new Logger(apiKey, createOptions())
  log.addMetaProperty('metaProp', 'metaVal')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls[0]
      t.deepEqual(payload.meta, {
        metaProp: 'metaVal'
      }, 'meta property injected into message payload')
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.warn('Howdy, folks!', (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('log.removeMetaProperty removes it from each message', (t) => {
  const log = new Logger(apiKey, createOptions())
  log.addMetaProperty('one', 1)
  log.addMetaProperty('two', 2)
  log.addMetaProperty('three', 3)
  log.removeMetaProperty('two')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
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


  log.warn('Howdy, folks!', (err, body) => {
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Can call .log with HTTP (not https)', (t) => {
  const log = new Logger(apiKey, createOptions({
    protocol: 'http'
  }))
  t.equal(log._req.useHttps, false, 'HTTPS is off')
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', () => { return true })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.warn('This is not secure', (err, res) => {
    t.equal(res.body.config.httpAgent.protocol, 'http:', 'http protocol is used')
    t.error(err, 'No error returned')
    t.end()
  })
})

test('Flushing on a timer includes multiple lines', (t) => {
  const log = new Logger(apiKey, createOptions({
    flushInterval: 1000
  }))
  t.on('end', async () => {
    nock.cleanAll()
  })

  nock(log._url)
    .post('/', (body) => {
      const payload = body.ls
      t.equal(payload.length, 3, 'Payload has the right number of entries')
      t.match(payload, [
        {
          timestamp: Number
        , line: 'Line 1'
        , level: 'INFO'
        , app: log.source.app
        , meta: {}
        }
      , {
          timestamp: Number
        , line: 'Line 2'
        , level: 'INFO'
        , app: log.source.app
        , meta: {}
        }
      , {
          timestamp: Number
        , line: 'Line 3'
        , level: 'INFO'
        , app: log.source.app
        , meta: {}
        }
      ])
      return true
    })
    .query(() => { return true })
    .reply(200, 'Ingester response')


  log.info('Line 1', (err, res) => {
    t.error(err, 'No error')
    t.deepEqual(res.lines, [
      'Line 1'
    , 'Line 2'
    , 'Line 3'
    ], 'All expected lines were sent')
    t.end()
  })
  log.info('Line 2', () => {
    t.fail('Callback not yet supported for buffered requests')
  })
  log.info('Line 3', () => {
    t.fail('Callback not yet supported for buffered requests')
  })
})
