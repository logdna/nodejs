'use strict'

const {test} = require('tap')
const logger = require('../lib/logger.js')
const configs = require('../lib/configs.js')
const {apiKey, createOptions} = require('./common/index.js')
const {Logger} = logger

test('Exports structures', async (t) => {
  t.equal(Object.keys(logger).length, 4, 'logger.js export properties count')
  t.match(logger, {
    Logger: Function
  , createLogger: Function
  , flushAll: Function
  , cleanUpAll: Function
  }, 'logger.js named properties are correct')

  t.equal(Object.keys(Logger.prototype).length, 12, 'Logger.prototype prop count')
  t.match(Logger.prototype, {
    log: Function
  , _bufferLog: Function
  , addMetaProperty: Function
  , removeMetaProperty: Function
  , _sendRequest: Function
  , _flush: Function
  , trace: Function
  , debug: Function
  , info: Function
  , warn: Function
  , debug: Function
  , fatal: Function
  }, 'Logger.prototype method names')
})

test('Logger instantiation', async (t) => {
  t.test('not using `new` returns instance anyway', async (tt) => {
    const log = Logger(apiKey, createOptions())
    tt.equal(log.constructor.name, 'Logger', 'instance returned')
  })
  t.test('Normal instantiation directly with Logger', async (tt) => {
    const log = new Logger(apiKey, createOptions())
    tt.equal(log.constructor.name, 'Logger', 'instance returned')
  })
  t.test('Intantiate via createLogger', async (tt) => {
    const log = logger.createLogger(apiKey, createOptions())
    tt.equal(log.constructor.name, 'Logger', 'instance returned')
  })
})

test('Logger instance properties', async (tt) => {
  tt.test('Check default property values', async (ttt) => {
    const log = new Logger(apiKey)
    ttt.match(log, {
      _flushLimit: 5000000
    , _retryTimes: 3
    , _flushInterval: 250
    , _retryTimeout: 3000
    , _failedBufRetentionLimit: 10000000
    , _max_length: true
    , _index_meta: false
    , _url: 'https://logs.logdna.com/logs/ingest'
    , _bufByteLength: 0
    , _buf: []
    , _meta: {}
    , _isLoggingBackedOff: false
    , _attempts: 0
    , __dbgLines: null
    , __bufSizePreserve: null
    , callback: null
    , source: {
        hostname: String
      , app: 'default'
      , level: 'INFO'
      , env: undefined
      , tags: undefined
      }
    , _req: {
        auth: {
          username: apiKey
        }
      , agent: Object
      , headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        , 'user-agent': /^logdna\/\d\.\d\.\d$/
        , 'Authorization': /^Basic \w+/
        }
      , qs: {
          hostname: String
        , mac: undefined
        , ip: undefined
        , tags: undefined
        }
      , timeout: 180000
      , withCredentials: false
      , useHttps: true
      }
    })
  })

  tt.test('Property Overrides with instantiation', async (ttt) => {
    const options = createOptions({
      failedBufRetentionLimit: 100
    , retryTimes: 5
    , retryTimeout: 200
    , flushInterval: 300
    , flushLimit: 400
    , max_length: 500
    , index_meta: true
    , level: 'DEBUG'
    , protocol: 'http'
    , timeout: 5000
    , shimProperties: ['one', 'two', 'three']
    })
    const log = new Logger(apiKey, options)

    ttt.match(log, {
      _flushLimit: options.flushLimit
    , _retryTimes: options.retryTimes
    , _flushInterval: options.flushInterval
    , _retryTimeout: options.retryTimeout
    , _failedBufRetentionLimit: options.failedBufRetentionLimit
    , _max_length: options.max_length
    , _index_meta: options.index_meta
    , _url: 'http://localhost:1337'
    , _bufByteLength: 0
    , _buf: []
    , _meta: {}
    , _isLoggingBackedOff: false
    , _attempts: 0
    , __dbgLines: null
    , __bufSizePreserve: null
    , callback: null
    , source: {
        hostname: String
      , app: options.app
      , level: options.level
      , env: undefined
      , tags: undefined
      }
    , _req: {
        auth: {
          username: apiKey
        }
      , agent: Object
      , headers: {
          'Content-Type': 'application/json; charset=UTF-8'
        , 'user-agent': /^logdna\/\d\.\d\.\d$/
        , 'Authorization': /^Basic \w+/
        }
      , qs: {
          hostname: String
        , mac: options.mac
        , ip: options.ip
        , tags: undefined
        }
      , timeout: options.timeout
      , withCredentials: false
      , useHttps: false
      }
    })
  })

  tt.test('Tags can be a string', async (ttt) => {
    const options = createOptions({
      tags: 'one ,  two,   three  '
    })
    const expected = 'one,two,three'
    const log = new Logger(apiKey, options)
    ttt.equal(log.source.tags, expected, 'Tag string was parsed correctly and set')
  })

  tt.test('Tags can be an array', async (ttt) => {
    const options = createOptions({
      tags: ['one ', 'two  ', 'three   ']
    })
    const expected = 'one,two,three'
    const log = new Logger(apiKey, options)
    ttt.equal(log.source.tags, expected, 'Tag string was parsed correctly and set')
  })
})

test('Instantiation Errors', async (tt) => {
  tt.test('Tags is not a string or an array', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        tags: {}
      })
    }, {
      message: 'Tags should be passed as a String or an Array'
    }, 'Expected error thrown')
  })

  tt.test('Timeout is not a number', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        timeout: 'NOPE'
      })
    }, {
      message: 'Timeout must be an Integer'
    }, 'Expected error thrown')
  })

  tt.test('Timeout is greater than the allowable value', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        timeout: configs.MAX_REQUEST_TIMEOUT + 1
      })
    }, {
      message: `Timeout cannot be longer than ${configs.MAX_REQUEST_TIMEOUT}`
    }, 'Expected error thrown')
  })

  tt.test('Bad hostname', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        hostname: '  NOPE'
      })
    }, {
      message: 'Invalid hostname'
    }, 'Expected error thrown')
  })

  tt.test('Bad hostname', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        mac: 'NOPE'
      })
    }, {
      message: 'Invalid MAC Address format'
    }, 'Expected error thrown')
  })

  tt.test('Bad IP address', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        ip: 'NOPE'
      })
    }, {
      message: 'Invalid IP Address format'
    }, 'Expected error thrown')
  })

  tt.test('Bad Server URL', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        logdna_url: 'NOPE'
      })
    }, {
      message: 'Invalid URL'
    }, 'Expected error thrown')
  })

  tt.test('Auth key is required', async (ttt) => {
    ttt.throws(() => {
      return new Logger()
    }, {
      message: 'LogDNA Ingestion Key is undefined or not passed as a String'
    }, 'Expected error thrown')
  })

  tt.test('Input value is too long', async (ttt) => {
    ttt.throws(() => {
      return new Logger(apiKey, {
        app: `x${'y'.repeat(configs.MAX_INPUT_LENGTH)}`
      })
    }, {
      message: 'App cannot be longer than 80 chars'
    }, 'Expected error thrown')
  })
})
