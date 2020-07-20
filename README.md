<p align="center">
  <a href="https://app.logdna.com">
    <img height="95" width="201" src="https://raw.githubusercontent.com/logdna/artwork/master/logo%2Bnode.png">
  </a>
  <p align="center">Node.js library for logging to <a href="https://logdna.com">LogDNA</a></p>
</p>

[![Build Status](https://travis-ci.org/logdna/nodejs.svg?branch=master)](https://travis-ci.org/logdna/nodejs)  [![Known Vulnerabilities](https://snyk.io/test/npm/logdna/badge.svg)](https://snyk.io/test/npm/logdna)  [![Coverage Status](https://coveralls.io/repos/github/logdna/nodejs/badge.svg?branch=master)](https://coveralls.io/github/logdna/nodejs?branch=master)
---

* **[Install](#install)**
* **[Setup](#setup)**
* **[Usage](#usage)**
* **[Supported Log Levels](#supported-log-levels)**
* **[Convenience Methods](#convenience-methods)**
* **[Events](#events)**
    * [addMetaProperty](#event-addMetaProperty)
    * [cleared](#event-cleared)
    * [error](#event-error)
    * [removeMetaProperty](#event-removeMetaProperty)
    * [send](#event-send)
    * [warn](#event-warn)
* **[API](#api)**
    * [createLogger](#createloggerkey-options)
    * [setupDefaultLogger](#setupdefaultloggerkey-options)
    * [logger.addMetaProperty](#loggeraddmetapropertykey-value)
    * [logger.flush](#loggerflush)
    * [logger.log](#loggerlogstatement-options)
    * [logger.removeMetaProperty](#loggerremovemetapropertykey)
* **[How Log Lines are Sent to LogDNA](#how-log-lines-are-sent-to-logdna)**
* **[Exponential Backoff Strategy](#exponential-backoff-strategy)**
* **[Best Practices](#best-practices)**
* **[Client Side Support](#client-side)**
* **[Bunyan Stream](#bunyan-stream)**
* **[Winston Transport](#winston-transport)**
* **[AWS Lambda Support](#aws-lambda-support)**
* **[License](#license)**
* **[Documentation for version <= 3.5.1](./docs/prior-to-version-4.md)**

## Migrating to Version `4.x`?

Previous versions are [still supported](./docs/prior-to-version-4.md), but if you are upgrading to >= 4.x, please see
our [migration document](./docs/migrating-to-4.md) for the differences between `4.0.0` and prior versions.

## Install

```javascript
$ npm install @logdna/node-client
```

## Setup
Operation requires a [LogDNA Ingestion Key](https://docs.logdna.com/docs/ingestion-key).  Without it, the client will not be able to post
logs to the cloud.  Please contact our support if you have questions about this!


## Usage

To use the client, simply create an instance, then call `.log()` or a [convenience method](#convenience-methods).

```javascript
const logdna = require('@lodgna/node-client')

const options = {
  app: 'myAppName'
, level: 'debug' // set a default for when level is not provided in function calls
}

const logger = logdna.createLogger('<YOUR INGESTION KEY>', options)

logger.log('This is an INFO statement', 'info')

logger.log('This will be a DEBUG statement, based on the default')

logger.log('This is an INFO statement with an options object', {
  level: 'info'
})

logger.info('This is an INFO statement using a convenience method')

logger.error('This is an error with meta data attached', {
  indexMeta: true
, meta: {
    message: 'TypeError for XYZ'
  , err
  }
})

logger.error(err) // Objects can be logged too
```

## Supported Log Levels
The client supports the following log levels.  They are case-insensitive.

* `TRACE`
* `DEBUG`
* `INFO`
* `WARN`
* `ERROR`
* `FATAL`

## Convenience Methods
We have set up convenience methods that automatically set the log level appropriately, and are easy to read.

### `logger.trace(msg[, options])`
### `logger.debug(msg[, options])`
### `logger.info(msg[, options])`
### `logger.warn(msg[, options])`
### `logger.error(msg[, options])`
### `logger.fatal(msg[, options])`

* `msg` [`<Object>`][] | [`<String>`][] - The message (or object) to log
* `options ` [`<Object>`][] - Per-message options.  See [`logger.log()`](#loggerlogstatement-options) for those.

## Events
The `Logger` is an `EventEmitter` and will emit events rather than use promises or callbacks to communicate its progress.  
Listening to the events is optional, although an `error` listener is recommended.

### Event: `'addMetaProperty'`
* [`<Object>`][]
    * `message` [`<String>`][] - Static message: `'Successfully added meta property'`
    * `key` [`<String>`][] - The added key name
    * `value` [`<String>`][] | [`<Number>`][] | [`<Boolean>`][] | [`<Object>`][] | [`<Array>`][] - The value

Emitted when a meta property is successfully added.  This meta property will be attached to each log message.

### Event: `'cleared'`
* [`<Object>`][]
    * `message` [`<String>`][] - A message indicating that everything was sent, or that nothing needed to be sent

When all log lines have been sent to LogDNA, this event is emitted.  If it emits after lines have successfully been sent,
then the message will be `'All accumulated log entries have been sent'`.  If there were no lines to be sent
(for example, if `flush()` was called proactively), then the message will be `'All buffers clear; Nothing to send'`.


### Event: `'error'`
* [`<TypeError>`][] | [`<Error>`][]
    * `message` [`<String>`][] - The error message
    * `meta` [`<String>`][] - Meta object populated with different information depending on the error

This is emitted when an asynchronous error is encountered.  Depending on the context, `meta` will contain
different pieces of information about the error.

**Error while sending to LogDNA**

The meta data for an error encountered during an HTTP call to LogDNA will have the following `meta` property in the error:

* `actual` [`<String>`][] - The raw error message from the HTTP client
* `code` [`<String>`][] | [`<Number>`][] - The HTTP agent's "code", or `statusCode` value
* `firstLine` [`<String>`][] - The first log line in the buffer that was sending
* `lastLine` [`<String>`][] - The last log line in the buffer that was sending
* `retrying` [`<Boolean>`][] - Whether or not an attempt will be made to resend the payload
* `attempts` [`<Number>`][] - The number of consecutive failures

**Error while calling `log()`**

When `log()` is called directly, or indirectly (via a convenience method), errors can be emitted if certain validations fail.  
If an invalid log level is provided, or if a bad data type is found for the `options` parameter, the `meta` property of the error
will contain the following:

* `got` [`<String>`][] - Description of the invalid input.  Will depend on error context.
* `expected` [`<String>`][] - The allowable log levels, if `options` is an invalid log level
* `used` [`<String>`][] - If a bad `level` is used in `options`, it will be ignored, and the default will be used.  This indicates what that value is.


### Event: `'removeMetaProperty'`
* [`<Object>`][]
    * `message` [`<String>`][] - Static message: `'Successfully removed meta property'`
    * `key` [`<String>`][] - The key that was removed

This is emitted when a key (and implied value) are removed from the global `meta` object.  If the key does not exist,
then a [`warn`](#event-warn) event with the same signature will be emitted instead.


### Event: `'send'`
* [`<Object>`][]
    * `httpStatus` [`<String>`][] - The `status` property of the HTTP agent's response
    * `firstLine` [`<String>`][] - The first log line in the buffer that was sent
    * `lastLine` [`<String>`][] - The last log line in the buffer that was sent
    * `totalLinesSent` [`<Number>`][] - The total number of lines in the sent buffer
    * `totalLinesReady` [`<Number>`][] - The number of lines left to be sent (if queueing has happened)
    * `bufferCount` [`<Number>`][] - The number of buffers left to be sent (if queueing has happened)

This is emitted when a buffer is successfully sent to LogDNA.  Since a buffer can contain many log entries, this summarizes the activity.  
In a high throughput system where `flushLimit` is exceeded and multiple buffers are waiting to be sent, information
like `totalLinesReady` and `bufferCount` help illustrate how much work is left to be done.  Any buffers that have been queued will
be sent one after another, ignoring any flush timer.


### Event: `'warn'`
* [`<Object>`][]
    * `message` [`<String>`][] - The warn message.  Depends on context.

This is emitted when there is no log data provided to the `log` method, or when `removeMetaProperty` is called with an unrecognized key.  
For those cases, additional properties (apart from `message`) are included:

**Warnings during `log()`**

* `statement` (Any) - If `log()` was called with a `null` string, or an invalid data type, this will contain the given log statement

**Warnings during `removeMetaProperty`**

* `key` [`<String>`][] - The key that was attempted to be removed, but did not exist

## API

### `createLogger(key[, options])`

* `key` [`<String>`][] - Your [ingestion key](https://docs.logdna.com/docs/ingestion-key)
* `options` [`<Object>`][]
    * `level` [`<String>`][] - [Level](#supported-log-levels) to be used if not specified elsewhere. **Default:** `INFO`
    * `tags` [`<Array>`][] | [`<String>`][] - Tags to be added to each message
    * `meta` [`<Object>`][] - Global metadata.  Added to each message, unless overridden.
    * `timeout` [`<Number>`][] - Msecond timeout for each HTTP request. **Default:** `5000`ms. **Max:** `300000`ms
    * `hostname` [`<String>`][] - Hostname for each HTTP request.
    * `mac` [`<String>`][] - MAC address for each HTTP request.
    * `ip` [`<String>`][] - IPv4 or IPv6 address for each HTTP request.
    * `url` [`<String>`][] - URL of the logging server.  **Default:** `https://logs.logdna.com/logs/ingest`
    * `flushLimit` [`<Number>`][] - Maximum total line lengths before a `flush` is forced. **Default:** `5000000`
    * `flushIntervalMs` [`<Number>`][] - Mseconds to wait before sending the buffer. **Default:** `250`ms
    * `shimProperties` [`<Array>`][] - List of dynamic `options` keys to look for when calling `log()`
    * `indexMeta` [`<Boolean>`][] - Controls whether or not `meta` data for each message is searchable. **Default:** `false`
    * `app` [`<String>`][] - Arbitrary app name for labeling each message. **Default:** `default`
    * `env` [`<String>`][] - An environment label attached to each message
    * `baseBackoffMs` [`<Number>`][] - Minimum exponential backoff time in milliseconds. **Default:** `3000`ms
    * `maxBackoffMs` [`<Number>`][] - Maximum exponential backoff time in milliseconds. **Default:** `30000`ms
    * `withCredentials` [`<Boolean>`][] - Passed to the request library in order to make CORS requests. **Default:** `false`
* Throws: [`<TypeError>`][] | [`<TypeError>`][] | [`<Error>`][]
* Returns: `Logger`

Returns a logging instance to use.  `flushLimit` and `flushIntervalMs` control when the buffer is sent to LogDNA, whichever comes first.  
The `flushIntervalMs` timer is only started after lines are logged, and the `flushLimit` is a size approximation based on the summation
of `.length` properties of each log line.  If the buffer size exceeds `flushLimit`, it will immediately send the buffer and ignore
the `flushIntervalMs` timer.

If `indexMeta` is `false`, then the meta data will still appear in LogDNA search, but the fields themselves will not be searchable.
If this option is `true`, then meta objects will be parsed and will be searchable up to three levels deep. Any fields
deeper than three levels will be stringified and cannot be searched.
**WARNING**: When this option is `true`, your metadata objects across all types of log messages *MUST* have consistent
types, or the metadata object may not be parsed properly!

`shimProperties` can be used to set up keys to look for in the `options` parameter of a `log()` call.  If the specified keys
are found in `options`, their key-values will be included the top-level of the final logging payload send to LogDNA.

For more information on the backoff algorithm and the options for it, see the [Exponential Backoff Strategy](#exponential-backoff-strategy) section.


### `setupDefaultLogger(key[, options])`

The same as [`createLogger()`](#createloggerkey-options), except for that it creates a singleton that will be re-used if called again.  
Users can call this multiple times, and the client package will maintain (create and/or return) the singleton.

Note that only the first call will instantiate a new instance.  Therefore, any successfive calls will ignore provided parameters.

```javascript
const logdna = require('@logdna/node-client')

const logger = logdna.setupDefaultLogger('<YOUR KEY HERE>')
const sameLogger = logdna.setupDefaultLogger()
```

### `logger.addMetaProperty(key, value)`

* `key` [`<String>`][] - The meta property's key
* `value` [`<String>`][] | [`<Number>`][] | [`<Boolean>`][] | [`<Object>`][] | [`<Array>`][] - The meta property's value
* Emits: [`addMetaProperty`](#event-addmetaproperty)

This adds a key-value to the global metadata, which is added to each log entry upon calling `log()`.
Although `meta` can be set on instantiation, this method provides a way to update it on-the-fly.

If `options.meta` is also used in a `log()` call, the key-value pairs from the global `meta` will be merged with
`options.meta`, and those will take precendence over any matching keys in the global metadata.

```javascript
// This will use `meta` to track logs from different modules
const logger = createLogger('<YOUR API KEY>', {
  meta: {
    module: 'main.js' // Global default
  }
})

logger.debug('This is the main module') // Uses global meta

// ... elsewhere, in another file, perhaps
logger.info('I am in module1.js', {
  meta: {module: __filename} // Overrides global meta
})
```

### `logger.flush()`

* Emits: [`cleared`](#event-cleared)

When `flush` is called, any messages in the buffer are sent to LogDNA.  It's not necessary to call this manually, although it is useful
to do so to ensure clean shutdown (see [Best Practices](#best-practices)).  When `log` is called, it automatically starts a timer
which will call `flush`, but it is idempotent and can be called at any time.

If log lines exist in the current buffer, it is pushed onto a send queue, and a new buffer is created.  The send queue is processed and uploaded to LogDNA.

If no work needs to be done, the `cleared` event is immediately emitted.


### `logger.log(statement[, options])`

* `statement` [`<String>`][] | [`<Object>`][] - Text or object of the log entry.  Objects are serialized.
* `options` [`<String>`][] | [`<Object>`][] - A string representing a [level](#supported-log-levels), or object:
    * `level` [`<String>`][] - Desired [level](#supported-log-levels) for the current message. **Default:** `logger.level`
    * `app` [`<String>`][] - App name to use for the current message. **Default:** `logger.app`
    * `env` [`<String>`][] - Environement name to use for the current message. **Default:** `logger.env`
    * `timestamp` [`<Number>`][] - Epoch ms time to use for the current message. Must be within 24 hours. **Default:** `Date.now()`
    * `context` [`<Object>`][] - Synonym for `meta`, but mutually exclusive; Ignored if `meta` exists.
    * `indexMeta` [`<Boolean>`][] - Allows for the `meta` to be searchable in LogDNA. **Default:** `logger.indexMeta`
    * `meta` [`<Object>`][] - Per-message meta data.  Combined with key-values created with `addMetaProperty`
* Emits: [warn](#event-warn), [error](#event-error)

Sends a string or object to LogDNA for storage.  If the [convenience methods](#convenience-methods) are used, they call this function
under the hood, so the options are the same.  The only difference is that `level` is automatically set in the convenience methods.


### `logger.removeMetaProperty(key)`

* `key` [`<String>`][] - The key (and implied value) to be remove from the global `meta` object.
* Emits: [`warn`](#event-warn)

Attempts to remove the given key from the global `meta` data object.  If the key is not found, `warn` is emitted.


## How Log Lines are Sent to LogDNA

In default operation, when `log` functions are called, the line is added to a buffer to cut down on HTTP traffic to the server.  
The buffer is flushed every `flushIntervalMs` milliseconds, or if the log line lengths grow beyond `flushLimit`.

When `flush` fires (or is called manually), the current buffer is put onto a send queue, and a new buffer is started.  The send queue begins
sending to LogDNA.  It will continue to send without pausing or honoring `flushIntervalMs` as long as there are buffers in the send queue.  
When the send queue is empty, `cleared` is emitted.

### Handling Errors

* `timeout` or `500` errors will be retried using an [exponential backoff strategy](#exponential-backoff-strategy), but will
  also emit `error` events along the way.
* User-level errors (such as `400`) will not be retried because they most likely would never be successful (if the message is deemed invalid),
  and `error` events are emitted for these also.


## Exponential Backoff Strategy

When HTTP failures happen, if they are deemed "retryable" (non-user errors), then the client will pause for a short time before
trying to resend.  The algorithm it implements is an exponential backoff with "Jitter" strategy that uses random numbers to statistically
spread out the wait times in order to avoid flooding.

The settings for `baseBackoffMs` and `maxBackoffMs` are used in this algorithm, and serve as the lower and upper boundaries for the wait time.

These types of errors are blocking since they are related to timeouts and server errors.  Logs will continue to buffer as normal, and
if the HTTP calls becomes successful, they will begin to send immediately, and without pause.


## Best Practices

* The client is optimized for high throughput.  Using a single instance is no problem, but multiples can be created with the same key if desired.
* Set up an `error` listener so that your app is aware of problems.  Things like HTTP errors are emitted this way.
* When shutting down your application, make sure all log entries are cleared.  Services like AWS Lambda can buffer log entries,
  so it might be worthwhile to pause for a short time before exiting:

```javascript
const {createLogger} = require('@logdna/node-client')
const {once} = require('events')

const logger = createLogger('<YOUR KEY HERE>')

logger.on('error', console.error)

async function clearLogger() {
  logger.flush()
  await once(logger, 'cleared')
  // Everything clear.  Did Lambda buffer anything?
  await sleep(1000)
  logger.flush()
  await once(logger, 'cleared')
}

```

## Client Side

Browserify Support in version ^3.0.1

```javascript
const Logger = require('logdna');
const logger = Logger.createLogger('API KEY HERE', {
  hostname:'ClientSideTest'
, app: 'sequence'
, indexMeta: true
})

const date = new Date().toISOString()
const logme = (callback) => {
  for (var i = 0; i < 10; i++) {
    logger.log('Hello LogDNA Test ' + date, { meta: { sequence: i }})
  }
  return callback && callback()
}


setInterval(logme, 5000);
```
If the above snippet is saved as a file main.js. Then with browserify you can convert this to a bundle.js file.
```
browserify main.js -o bundle.js
```
The bundle.js file can be included like any other script.
```
<script src="bundle.js"></script>
```
When using NodeJS inside a browser, the domain needs to be whitelisted in your LogDNA organization settings

## Bunyan Stream

For Bunyan Stream support please reference our [logdna-bunyan](https://github.com/logdna/logdna-bunyan/) module

## Winston Transport

For Winston support please reference our [logdna-winston](https://github.com/logdna/logdna-winston/) module

## AWS Lambda Support

AWS Lambda allows users to add logging statements to their Lambda Functions. You can choose to setup the logger
as shown above, or you can override the `console.log`, `console.error` statements. AWS Lambda overrides the `console.log`,
`console.error`, `console.warn`, and `console.info` functions as indicated
[here](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html), within the scope of the handler (main)
function. You can setup an override as follows:

```javascript
'use strict'

const https = require('https')
const Logger = require('logdna')

const options = {
  env: 'env'
, app: 'lambda-app'
, hostname: 'lambda-test'
, indexMeta: true
}

const _log = console.log
const _error = console.error

const logger = Logger.setupDefaultLogger('YOUR API KEY', options)

function log(...args) {
  logger.log.apply(args)
  _log.apply(...args)
}

function error(...args) {
  logger.error.apply(args)
  _error.apply(args)
}

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */
exports.handler = (event, context, callback) => {
  console.log = log
  console.error = error

  // Your code here
  console.log('How bout normal log')
  console.error('Try an error')

  callback()
};
```


## License

[MIT](./LICENSE) © [LogDNA](https://logdna.com/)

*Happy Logging!*

[`<Boolean>`]: https://mdn.io/boolean
[`<Number>`]: https://mdn.io/number
[`<Object>`]: https://mdn.io/object
[`<String>`]: https://mdn.io/string
[`<Array>`]: https://mdn.io/array
[`<TypeError>`]: https://mdn.io/TypeError
[`<RangeError>`]: https://mdn.io/RangeError
[`<Error>`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
