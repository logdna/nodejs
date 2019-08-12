<p align="center">
  <a href="https://app.logdna.com">
    <img height="95" width="201" src="https://raw.githubusercontent.com/logdna/artwork/master/logo%2Bnode.png">
  </a>
  <p align="center">Node.js library for logging to <a href="https://app.logdna.com">LogDNA</a></p>
</p>

[![Build Status](https://travis-ci.org/logdna/nodejs.svg?branch=master)](https://travis-ci.org/logdna/nodejs)  [![Known Vulnerabilities](https://snyk.io/test/npm/logdna/badge.svg)](https://snyk.io/test/npm/logdna)

---
* **[Install](#install)**
* **[Setup](#setup)**
* **[Usage](#usage)**
* **[API](#api)**
* **[Client Side Support](#client-side)**
* **[Bunyan Stream](#bunyan-stream)**
* **[Winston Transport](#winston-transport)**
* **[AWS Lambda Support](#aws-lambda-support)**
* **[License](#license)**


## Install

```javascript
$ npm install --save logdna
```

## Setup
```javascript
var Logger = require('logdna');
var options = {
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    app: appName,
    env: envName
};

// Defaults to false, when true ensures meta object will be searchable
options.index_meta = true;

// Add tags in array or comma-separated string format:
options.tags = ['logging', 'nodejs', 'logdna'];
// or:
options.tags = 'logging,nodejs,logdna';

// Define a singleton instance
var logger = Logger.setupDefaultLogger(apikey, options);

// Create multiple loggers with different options
var logger = Logger.createLogger(apikey, options);

```
_**Required**_
* [LogDNA Ingestion Key](https://app.logdna.com/manage/profile)

_**Optional**_
* Hostname - *(String)* - max length 32 chars
* MAC Address - *(String)*
* IP Address - *(String)*
* Max Length - *(Boolean)* - formatted as options.max_length
* Index Meta - *(Boolean)* - formatted as options.index_meta
* logdna_url - *(String)*  - alternate ingest URL

## Usage

After initial setup, logging is as easy as:
```javascript
// Simplest use case
logger.log('My Sample Log Line');

// Add a custom level
logger.log('My Sample Log Line', 'MyCustomLevel');

// Include an App name with this specific log
logger.log('My Sample Log Line', { level: 'Warn', app: 'myAppName'});

// Pass an associated object along with a specific line as metadata...
var meta = {
    foo: 'bar',
    nested: {
      nest1: 'nested text'
    }
}

var opts = {
  level: 'warn',
  meta: meta
}

logger.log('My Sample Log Line', opts);
```

For more options, this module also offers:
```javascript
// We support the following six levels
logger.info('My Sample Log Line');
logger.warn('My Sample Log Line');
logger.debug('My Sample Log Line');
logger.error('My Sample Log Line');
logger.fatal('My Sample Log Line');

// Functions above also accept additional options
logger.trace('My Sample Log Line', { app: 'myAppName'});

var opts = {
  level: 'trace',
  meta: {
    foo: 'bar',
    nested: {
      nest1: 'nested text'
    }
  }
}

// Functions above also pass any associated objects along as metadata
logger.trace('My Sample Log Line', opts);
```
You will see the outputs in your LogDNA dashboard.

## API

### createLogger(key, [options])
---
#### key

* _**Required**_
* Type: `String`
* Values: `YourIngestionKey`

The [LogDNA Ingestion Key](https://app.logdna.com/manage/profile) associated with your account.

#### options

##### app

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `YourCustomApp`
* Max Length: `32`

The default app passed along with every log sent through this instance.

##### hostname

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `YourCustomHostname`
* Max Length: `32`

The default hostname passed along with every log sent through this instance.

##### env

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `YourCustomEnvironment`
* Max Length: `32`

The default environment passed along with every log sent through this instance.

##### index_meta

* _**Optional**_
* Type: `Boolean`
* Default: `false`

We allow meta objects to be passed with each line. By default these meta objects will be stringified and will not be searchable,
but will be displayed for informational purposes.

If this option is turned to true then meta objects will be parsed and will be searchable up to three levels deep. Any fields deeper than three levels will be stringified and cannot be searched.

*WARNING* When this option is true, your metadata objects across all types of log messages MUST have consistent types or the metadata object may not be parsed properly!

##### cleanUpSIGTERM


*WARNING* Deprecated, you will have to opt-in and call cleanUpAll, where appropriate. AWS Lambda users have issues with listening on SIGTERM/SIGINT

##### cleanUpSIGINT

*WARNING* Deprecated, you will have to opt-in and call cleanUpAll, where appropriate. AWS Lambda users have issues with listening on SIGTERM/SIGINT

##### ip

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `10.0.0.1`

The default IP Address passed along with every log sent through this instance.

##### level

* _**Optional**_
* Type: `String`
* Default: `Info`
* Values: `Debug`, `Trace`, `Info`, `Warn`, `Error`, `Fatal`, `YourCustomLevel`
* Max Length: `32`

The default level passed along with every log sent through this instance.

##### mac

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `C0:FF:EE:C0:FF:EE`

The default MAC Address passed along with every log sent through this instance.

##### max_length

* _**Optional**_
* Type: `Boolean`
* Default: `true`

By default the line has a maximum length of 32000 chars, this can be turned off with the value false.

##### timeout

* _**Optional**_
* Type: `Integer`
* Default: `180000`
* Max Value: `300000`

The length of the timeout on the POST request that is sent to LogDNA.

##### with_credentials

* _**Optional**_
* Type: `Boolean`
* Default: `false`

The withCredentials option passed to the request library. In order to make CORS requests this value is set to false by default.

### log(line, [options])
---
#### line

* _**Required**_
* Type: `String`
* Default: `''`
* Max Length: `32000`

The line which will be sent to the LogDNA system.

#### options

Please note that if you are using variables for any of the below options, their values may change in between the line being logged and the batch of lines being flushed to our servers. If your variables change frequently, we highly recommend copying the value instead of referencing the variable directly.

##### level

* _**Optional**_
* Type: `String`
* Default: `Info`
* Values: `Debug`, `Trace`, `Info`, `Warn`, `Error`, `Fatal`, `YourCustomLevel`
* Max Length: `32`

The level passed along with this log line.

##### app

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `YourCustomApp`
* Max Length: `32`

The app passed along with this log line.

##### env

* _**Optional**_
* Type: `String`
* Default: `''`
* Values: `YourCustomEnvironment`
* Max Length: `32`

The environment passed along with this log line.

##### meta

* _**Optional**_
* Type: `JSON`
* Default: `null`

A meta object that provides additional context about the log line that is passed.

##### index_meta

* _**Optional**_
* Type: `Boolean`
* Default: `false`

We allow meta objects to be passed with each line. By default these meta objects will be stringified and will not be searchable,
but will be displayed for informational purposes.

If this option is turned to true then meta objects will be parsed and will be searchable up to three levels deep. Any fields deeper than three levels will be stringified and cannot be searched.

*WARNING* When this option is true, your metadata objects across all types of log messages MUST have consistent types or the metadata object may not be parsed properly!

##### timestamp

* _**Optional**_
* Default: `Date.now()`

A timestamp in ms, must be within one day otherwise it will be dropped and Date.now() will be used in its place.

### flushAll()
---
A function that flushes all existing loggers that are instantiated by createLogger.

### cleanUpAll()
---
A function that flushes all existing loggers that are instantiated by createLogger, and then removes references to them. Should only be called when you are finished logging.

## Client Side
Browserify Support in version ^3.0.1
```javascript
const Logger = require('logdna');
const logger = Logger.createLogger('API KEY HERE', {
    hostname:'ClientSideTest'
    , app: 'sequence'
    , index_meta: true
});

const date = new Date().toISOString();
const logme = (callback) => {
    for (var i = 0; i < 10; i++) {
        logger.log('Hello LogDNA Test ' + date, { meta: { sequence: i }});
    }
    return callback && callback();
};


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

## Bunyan Stream

For Bunyan Stream support please reference our [logdna-bunyan](https://github.com/logdna/logdna-bunyan/) module

## Winston Transport

For Winston support please reference our [logdna-winston](https://github.com/logdna/logdna-winston/) module

## AWS Lambda Support

AWS Lambda allows users to add logging statements to their Lambda Functions. You can choose to setup the logger
as shown above, or you can override the console.log, console.error statements. AWS Lambda overrides the console.log, console.error, console.warn, and console.info functions as indicated [here](http://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-logging.html), within the scope of the handler (main) function. You can setup an override as follows:

```javascript
'use strict';

const https = require('https');
const Logger = require('logdna');

const options = {
    env: 'env'
    , app: 'lambda-app'
    , hostname: 'lambda-test'
    , index_meta: true
};

var _log = console.log;
var _error = console.error;

var logger = Logger.setupDefaultLogger('YOUR API KEY', options);


var log = function() {
    logger.log([...arguments].join(' '));
    _log.apply(console, arguments);
};

var error = function() {
    logger.error([...arguments].join(' '));
    _error.apply(console, arguments);
};

/**
 * Pass the data to send as `event.data`, and the request options as
 * `event.options`. For more information see the HTTPS module documentation
 * at https://nodejs.org/api/https.html.
 *
 * Will succeed with the response body.
 */
exports.handler = (event, context, callback) => {
    console.log = log;
    console.error = error;

    // Your code here
    console.log('How bout normal log');
    console.error('Try an error');

    callback();
};
```

## HTTP Exception Handling
If the logger does not receive a successful response from the server, it retains the logs in a buffer and will retry with the next request. The size of the retry buffer that saves logs that failed to send and the retry timeout are configurable via:

``` javascript
var options = {
    failedBufRetentionLimit: 10000000 //bytes
    retryTimeout: 3000 //milliseconds
};

var logger = Logger.setupDefaultLogger(apikey, options);
```

## Troubleshooting

This library takes advantage of [`util.debuglog()`](https://nodejs.org/api/util.html#util_util_debuglog_section) to
output details about message handling such as:
  - When the logger receives a message (useful for indirect usages such as bunyan, winston, or custom wrappers)
  - An indication of when messages are actually sent to the API (they may be buffered for a time)
  - An indication of whether the API responds with a success or failure.

For cases where you do not see your log messages appear in LogDNA, these debug messages can make it easier to tell if
the problem is on the sending or receiving end.  They can also provide valuable information which can speed up diagnosis
if you need to work with the LogDNA support staff.

You can enable debug messages with the `NODE_DEBUG=logdna` environment variable. See the `util.debuglog()`
documentation for more information.

## License

MIT © [LogDNA](https://logdna.com/)

*Happy Logging!*
