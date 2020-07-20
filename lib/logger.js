'use strict'

const EventEmitter = require('events')
const os = require('os')
const querystring = require('querystring')
const {isIP} = require('net')
const Agent = require('agentkeepalive')
const axios = require('axios')
const stringify = require('json-stringify-safe')
const constants = require('./constants.js')
const {checkStringParam, isValidTimestamp, has} = require('./validators/index.js')
const backoffWithJitter = require('./backoff-with-jitter.js')
const typeOf = require('./lang/type-of.js')

const kLineLengthTotal = Symbol('lineLengthTotal')
const kBuffer = Symbol('buffer')
const kMeta = Symbol('meta')
const kIsLoggingBackedOff = Symbol.for('isLoggingBackedOff')
const kFlusher = Symbol('flusher')
const kAttempts = Symbol('attempts')
const kRequestDefaults = Symbol.for('requestDefaults')
const kReadyToSend = Symbol.for('readyToSend')
const kIsSending = Symbol.for('isSending')
const kTotalLinesReady = Symbol.for('totalLinesReady')
const kBackoffMs = Symbol('backoffMs')

const ALL_CLEAR_SENT = 'All accumulated log entries have been sent'
const ALL_CLEAR_EMPTY = 'All buffers clear; Nothing to send'
const META_ADD_SUCCESS = 'Successfully added meta property'
const WARN_LOG_IGNORED = 'Log statement was empty.  Ignored'
const REMOVE_META_WARN = 'Property is not an existing meta property.  Cannot remove.'
const REMOVE_META_SUCCESS = 'Successfully removed meta property'
const ERROR_CODES_TO_RETRY = new Set([
  500
, 'ECONNABORTED' // timeout
])

class Logger extends EventEmitter {
  constructor(key, opts) {
    super()
    const options = opts || {}

    checkStringParam(key, 'LogDNA Ingestion Key', true)

    // Defaults for instantiation parameters
    this.level = 'INFO'
    this.url = constants.LOGDNA_URL
    this.flushLimit = constants.FLUSH_BYTE_LIMIT
    this.flushIntervalMs = constants.FLUSH_INTERVAL_MS
    this.shimProperties = undefined
    this.indexMeta = false
    this.app = 'default'
    this.env = undefined
    this.baseBackoffMs = constants.BASE_BACKOFF_MILLIS
    this.maxBackoffMs = constants.MAX_BACKOFF_MILLIS

    // Initialize internal instance variables
    this[kLineLengthTotal] = 0
    this[kBuffer] = []
    this[kMeta] = {}
    this[kIsLoggingBackedOff] = false
    this[kAttempts] = 0
    this[kRequestDefaults] = undefined
    this[kFlusher] = null
    this[kReadyToSend] = []
    this[kIsSending] = false
    this[kTotalLinesReady] = 0
    this[kBackoffMs] = constants.BASE_BACKOFF_MILLIS

    let useHttps = true
    let withCredentials = false
    let tags = undefined
    let timeout = constants.DEFAULT_REQUEST_TIMEOUT
    let hostname = os.hostname()
    let mac = undefined
    let ip = undefined

    if (has(options, 'level')) {
      const level = options.level.toUpperCase()
      if (!constants.LOG_LEVELS.includes(level)) {
        const err = new Error('Invalid level')
        err.meta = {
          got: level
        , expectedOneOf: constants.LOG_LEVELS
        }
        throw err
      }
      this.level = level
    }

    if (has(options, 'tags')) {
      tags = options.tags
      if (typeof tags === 'string') {
        tags = tags.split(constants.TAGS_RE)
      }
      if (!Array.isArray(tags)) {
        const err = new TypeError('tags should be passed as a String or an Array')
        err.meta = {got: options.tags}
        throw err
      }
      tags = tags
        .filter((tag) => { return tag !== '' })
        .map((tag) => { return tag.trim() })
        .join(',')
    }

    if (has(options, 'meta')) {
      const meta = options.meta
      if (typeOf(meta) !== 'object') {
        const err = new TypeError('meta needs to be an object of key-value pairs')
        err.meta = {got: meta}
        throw err
      }
      this[kMeta] = {...meta}
    }

    if (has(options, 'timeout')) {
      if (!Number.isInteger(options.timeout)) {
        const err = new TypeError('timeout must be an Integer')
        err.meta = {got: options.timeout}
        throw err
      }
      if (options.timeout > constants.MAX_REQUEST_TIMEOUT) {
        throw new Error(
          `timeout cannot be longer than ${constants.MAX_REQUEST_TIMEOUT}`
        )
      }
      timeout = options.timeout
    }

    if (has(options, 'hostname')) {
      checkStringParam(options.hostname, 'Hostname')
      if (!constants.HOSTNAME_CHECK.test(options.hostname)) {
        throw new Error('Invalid hostname')
      }
      hostname = options.hostname
    }

    if (has(options, 'mac')) {
      checkStringParam(options.mac, 'MAC Address')
      if (!constants.MAC_ADDR_CHECK.test(options.mac)) {
        throw new Error('Invalid MAC Address format')
      }
      mac = options.mac
    }

    if (has(options, 'ip')) {
      checkStringParam(options.ip, 'IP Address')
      if (!isIP(options.ip)) {
        throw new Error('Invalid IP Address format')
      }
      ip = options.ip
    }

    if (has(options, 'logdna_url')) {
      console.warn('[Deprecated] logdna_url is deprecated.  Please use url instead.')
      options.url = options.logdna_url
    }
    if (has(options, 'url')) {
      checkStringParam(options.url, 'url')
      if (!constants.PROTOCOL_RE.test(options.url)) {
        const err = new Error('Invalid URL protocol')
        err.meta = {
          expected: 'http:// or https://'
        }
        throw err
      }
      useHttps = options.url.startsWith('https://')
      this.url = options.url
    }

    if (has(options, 'flushLimit')) {
      if (!Number.isInteger(options.flushLimit)) {
        const err = new TypeError('flushLimit must be an integer')
        err.meta = {got: options.flushLimit}
        throw err
      }
      this.flushLimit = options.flushLimit
    }

    if (has(options, 'flushIntervalMs')) {
      if (!Number.isInteger(options.flushIntervalMs)) {
        const err = new TypeError('flushIntervalMs must be an integer')
        err.meta = {got: options.flushIntervalMs}
        throw err
      }
      this.flushIntervalMs = options.flushIntervalMs
    }

    if (has(options, 'baseBackoffMs')) {
      if (!Number.isInteger(options.baseBackoffMs)
        || options.baseBackoffMs <= 0) {

        const err = new RangeError('baseBackoffMs must be an integer > 0')
        err.meta = {got: options.baseBackoffMs}
        throw err
      }
      this.baseBackoffMs = options.baseBackoffMs
    }

    if (has(options, 'maxBackoffMs')) {
      if (!Number.isInteger(options.maxBackoffMs)
        || options.maxBackoffMs <= 0
        || options.maxBackoffMs < this.baseBackoffMs) {

        const err = new RangeError(
          'maxBackoffMs must be an integer > 0 and > baseBackoffMs'
        )
        err.meta = {
          got: options.maxBackoffMs
        , baseBackoffMs: this.baseBackoffMs
        }
        throw err
      }
      this.maxBackoffMs = options.maxBackoffMs
    }

    if (has(options, 'shimProperties')) {
      const val = options.shimProperties
      if (!Array.isArray(val) || !val.length) {
        const err = new TypeError('shimProperties must be a non-empty array')
        err.meta = {got: val}
        throw err
      }
      this.shimProperties = val
    }

    if (has(options, 'max_length')) {
      const err = new Error('Removed.  max_length is no longer an option.')
      throw err
    }

    if (has(options, 'index_meta')) {
      console.warn(
        '[Deprecated] index_meta is deprecated.  Please use indexMeta.'
      )
      options.indexMeta = options.index_meta
    }
    if (has(options, 'indexMeta')) {
      this.indexMeta = Boolean(options.indexMeta)
    }

    if (has(options, 'app')) {
      checkStringParam(options.app, 'app')
      this.app = options.app
    }

    if (has(options, 'env')) {
      checkStringParam(options.env, 'env')
      this.env = options.env
    }

    if (has(options, 'with_credentials')) {
      console.warn(
        '[Deprecated] with_credentials is deprecated.  Please use withCredentials.'
      )
      options.withCredentials = options.with_credentials
    }
    if (has(options, 'withCredentials')) {
      withCredentials = Boolean(options.withCredentials)
    }

    let transportedBy = ''
    if (has(options, 'UserAgent')) {
      // Then the caller is a transport helper like Bunyan or Winston
      // @see https://github.com/logdna/logdna-bunyan
      // @see https://github.com/logdna/logdna-winston
      transportedBy = ` (${options.UserAgent})`
    }

    this[kRequestDefaults] = {
      auth: {username: key}
    , agent: useHttps
        ? new Agent.HttpsAgent(constants.AGENT_SETTING)
        : new Agent(constants.AGENT_SETTING)
    , headers: {
        ...constants.DEFAULT_REQUEST_HEADER
      , 'user-agent': `${constants.USER_AGENT}${transportedBy}`
      , 'Authorization': 'Basic ' + Buffer.from(`${key}:`).toString('base64')
      }
    , qs: {
        hostname
      , mac
      , ip
      , tags
      }
    , timeout
    , withCredentials
    , useHttps
    }
  }

  addMetaProperty(key, value) {
    this[kMeta] = {
      ...this[kMeta]
    , [key]: value
    }
    this.emit('addMetaProperty', {
      message: META_ADD_SUCCESS
    , key
    , value
    })
  }

  bufferLog(payload) {
    const lineLength = payload.line.length

    this[kLineLengthTotal] += lineLength
    this[kBuffer].push(payload)

    if (!this[kIsLoggingBackedOff] && (this[kLineLengthTotal] >= this.flushLimit)) {
      // Buffer size meets (or exceeds) flush limit.  Immediately flushing
      this.flush()
      return
    }

    if (!this[kFlusher]) {
      this[kFlusher] = setTimeout(this.flush.bind(this), this.flushIntervalMs)
    }
  }

  flush() {
    // Roll the current buffer into readyToSend and begin a new buffer
    clearTimeout(this[kFlusher])
    this[kFlusher] = null

    const bufferLength = this[kBuffer].length
    if (bufferLength) {
      this[kReadyToSend].push(this[kBuffer])
      this[kBuffer] = []
      this[kLineLengthTotal] = 0
      this[kTotalLinesReady] += bufferLength
    }

    if (this[kReadyToSend].length) {
      this.send()
      return
    }

    // setImmediate allows us to flush THEN await the event in code
    setImmediate(this.emit.bind(this), 'cleared', {
      message: ALL_CLEAR_EMPTY
    })
  }

  log(statement, opts) {
    opts = opts || {}

    if (statement === null
      || statement === undefined
      || typeof statement === 'string' && !statement.length) {

      this.emit('warn', {
        message: WARN_LOG_IGNORED
      , statement
      })
      return
    }

    const message = {
      timestamp: Date.now()
    , line: undefined
    , level: this.level
    , app: this.app
    , env: this.env
    , meta: undefined
    }

    if (typeof opts === 'string') {
      // Then it should be a log level string
      const level = opts.toUpperCase()
      if (!constants.LOG_LEVELS.includes(level)) {
        const err = new TypeError(
          'If \'options\' is a string, then it must be a valid log level'
        )
        err.meta = {
          got: opts
        , expected: constants.LOG_LEVELS
        }
        this.emit('error', err)
        return
      }
      message.level = level
      opts = {}
    }
    const optsType = typeOf(opts)
    if (optsType !== 'object') {
      const err = new TypeError(
        'options parameter must be a level (string), or object'
      )
      err.meta = {
        got: optsType
      }
      this.emit('error', err)
      return
    }

    message.line = typeof statement === 'string'
      ? statement
      : stringify(statement)

    if (has(opts, 'level')) {
      // They've passed in a `level`.  Validate it.
      const level = opts.level.toUpperCase()
      if (constants.LOG_LEVELS.includes(level)) {
        message.level = level
      } else {
        const err = new Error('Invalid log level.  Using the default instead.')
        err.meta = {
          got: level
        , expected: constants.LOG_LEVELS
        , used: message.level
        }
        this.emit('error', err)
      }
    }

    message.app = opts.app || message.app
    message.env = opts.env || message.env

    if (opts.timestamp && isValidTimestamp(opts.timestamp)) {
      message.timestamp = opts.timestamp
    }

    let meta = opts.meta || {}
    if (opts.context && !opts.meta && typeOf(opts.context) === 'object') {
      meta = opts.context
    }

    meta = {...this[kMeta], ...meta}
    // Each message's options can override this.indexMeta
    const indexMeta = has(opts, 'indexMeta')
      ? opts.indexMeta
      : this.indexMeta

    if (indexMeta) {
      message.meta = meta
    } else {
      message.meta = stringify(meta)
    }

    if (opts.logSourceCRN) {
      message.logSourceCRN = opts.logSourceCRN
    }

    if (opts.saveServiceCopy) {
      message.saveServiceCopy = opts.saveServiceCopy
    }

    if (opts.appOverride) {
      message.appOverride = opts.appOverride
    }

    let withShims = null
    if (this.shimProperties) {
      const shimVals = {}
      for (const prop of this.shimProperties) {
        if (has(opts, prop)) {
          shimVals[prop] = opts[prop]
        }
      }
      withShims = {
        ...message
      , ...shimVals
      }
    }

    const payload = withShims || message
    this.bufferLog(payload)
  }

  removeMetaProperty(key) {
    if (!has(this[kMeta], key)) {
      this.emit('warn', {
        message: REMOVE_META_WARN
      , key
      })
      return
    }
    const rebuilt = {}
    for (const [k, v] of Object.entries(this[kMeta])) {
      if (k === key) continue
      rebuilt[k] = v
    }
    this[kMeta] = rebuilt

    this.emit('removeMetaProperty', {
      message: REMOVE_META_SUCCESS
    , key
    })
  }

  send(calledByFlush = true) {
    if (this[kIsSending] && calledByFlush) return
    this[kIsSending] = true

    const buffer = this[kReadyToSend][0]
    const qs = {
      now: Date.now()
    , ...this[kRequestDefaults].qs
    }

    const config = {
      method: 'post'
    , url: this.url + '?' + querystring.stringify(qs)
    , headers: this[kRequestDefaults].headers
    , data: stringify({e: 'ls', ls: buffer})
    , timeout: this[kRequestDefaults].timeout
    , withCredentials: this[kRequestDefaults].withCredentials
    , json: true
    , httpsAgent: undefined
    , httpAgent: undefined
    }

    const agentKey = this[kRequestDefaults].useHttps
      ? 'httpsAgent'
      : 'httpAgent'
    config[agentKey] = this[kRequestDefaults].agent

    const firstLine = buffer[0].line
    const lastLine = buffer.length > 1
      ? buffer[buffer.length - 1].line
      : null

    axios(config)
      .then((response) => {
        // We have a 200-level success code.
        const totalLinesSent = buffer.length
        this[kIsLoggingBackedOff] = false
        this[kAttempts] = 0
        this[kIsSending] = false
        this[kTotalLinesReady] -= totalLinesSent
        this[kReadyToSend].shift()

        // Assist GC by killing the buffer and removing it from readyToSend
        buffer.length = 0

        this.emit('send', {
          httpStatus: response.status
        , firstLine
        , lastLine
        , totalLinesSent
        , totalLinesReady: this[kTotalLinesReady]
        , bufferCount: this[kReadyToSend].length
        })

        if (this[kReadyToSend].length) {
          // Continue to send any backed up payloads that have accumulated
          this.send()
          return
        }

        this.emit('cleared', {
          message: ALL_CLEAR_SENT
        })
      })
      .catch((error) => {
        const code = error.response
          ? error.response.status
          : error.code // timeouts will populate this

        const retrying = ERROR_CODES_TO_RETRY.has(code)
        const err = new Error('An error occured while sending logs to the cloud.')
        err.meta = {
          actual: error.message
        , code
        , firstLine
        , lastLine
        , retrying
        , attempts: ++this[kAttempts]
        }
        this.emit('error', err)

        if (retrying) {
          this[kIsLoggingBackedOff] = true
          this[kBackoffMs] = backoffWithJitter(
            this.baseBackoffMs
          , this.maxBackoffMs
          , this[kBackoffMs]
          )
          setTimeout(() => {
            this.send(false)
          }, this[kBackoffMs])
          return
        }

        // User-level errors will be discarded since they will never succeed
        this[kIsSending] = false
        this[kTotalLinesReady] -= buffer.length
        this[kAttempts] = 0
        this[kReadyToSend].shift()
        buffer.length = 0
        if (this[kReadyToSend].length) {
          this.send()
          return
        }

        this.emit('cleared', {
          message: ALL_CLEAR_SENT
        })
      })
  }
}

// Make documented methods enumerable as a courtesy
Object.defineProperties(Logger.prototype, {
  addMetaProperty: {
    enumerable: true
  }
, flush: {
    enumerable: true
  }
, log: {
    enumerable: true
  }
, removeMetaProperty: {
    enumerable: true
  }
})

/*
 *  Populate short-hand for each supported Log Level
 */
for (const level of constants.LOG_LEVELS) {
  const levelLowerCase = level.toLowerCase()

  Object.defineProperties(Logger.prototype, {
    [levelLowerCase]: {
      enumerable: true
    , writable: false
    , configurable: false
    , value(statement, opts) {
        const optsType = typeOf(opts)
        if (opts && optsType !== 'object') {
          const err = new TypeError(
            `If passed, log.${levelLowerCase} requires 'options' to be an object`
          )
          err.meta = {
            got: optsType
          }
          throw err
        }
        const options = {
          ...opts
        , level
        }
        this.log(statement, options)
      }
    }
  })
}

module.exports = Logger
