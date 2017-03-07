<p align="center">
  <a href="https://app.logdna.com">
    <img height="95" width="201" src="https://raw.githubusercontent.com/logdna/artwork/master/logo%2Bnode.png">
  </a>
  <p align="center">Node.js library for logging to <a href="https://app.logdna.com">LogDNA</a></p>
</p>

[![Build Status](https://travis-ci.org/logdna/nodejs.svg?branch=master)](https://travis-ci.org/logdna/nodejs)  [![Known Vulnerabilities](https://snyk.io/test/npm/logdna/badge.svg)](https://snyk.io/test/npm/logdna)

===

* **[Install](#install)**
* **[Setup](#setup)**
* **[Usage](#usage)**
* **[API](#api)**
* **[Winston Transport](#winston-transport)**
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
    app: appName
};

// Defaults to false, when true ensures meta object will be searchable
options.index_meta = true;

// Define a singleton instance
var logger = Logger.setupDefaultLogger(apikey, options);

// Create multiple loggers with different options
var logger = Logger.createLogger(apikey, options);
```
_**Required**_
* [LogDNA API Key](https://app.logdna.com/manage/profile)

_**Optional**_
* Hostname - *(String)* - max length 32 chars
* MAC Address - *(String)*
* IP Address - *(String)*
* Max Length - *(Boolean)* - formatted as options.max_length
* Index Meta - *(Boolean)* - formatted as options.index_meta

## Usage

After initial setup, logging is as easy as:
```javascript
// Simplest use case
logger.log('My Sample Log Line');

// Add a custom level
logger.log('My Sample Log Line', 'MyCustomLevel');

// Include an App name with this specific log
logger.log('My Sample Log Line', { level: 'Warn', app: 'myAppName'});

// Pass any associated objects along as metadata
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
  level: trace,
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

## API

### createLogger(key, [options])

#### key

_**Required**_
Type: `String`
Values: `YourAPIKey`

The [LogDNA API Key](https://app.logdna.com/manage/profile) associated with your account.

#### options

##### app

_**Optional**_
Type: `String`
Default: `''`
Values: `YourCustomApp`
Max Length: `32`

The default app passed along with every log sent through this instance.

##### hostname

_**Optional**_
Type: `String`
Default: `''`
Values: `YourCustomHostname`
Max Length: `32`

The default hostname passed along with every log sent through this instance.

##### index_meta

_**Optional**_
Type: `Boolean`
Default: `false`

We allow meta objects to be passed with each line. By default these meta objects will be stringified and will not be searchable,
but will be displayed for informational purposes.

If this option is turned to true then meta objects will be parsed and will be searchable up to three levels deep. Any fields deeper than three levels will be stringified and cannot be searched.

*WARNING* When this option is true, your metadata objects across all types of log messages MUST have consistent types or the metadata object may not be parsed properly!

##### ip

_**Optional**_
Type: `String`
Default: `''`
Values: `10.0.0.1`

The default IP Address passed along with every log sent through this instance.

##### level

_**Optional**_
Type: `String`
Default: `Info`
Values: `Debug`, `Trace`, `Info`, `Warn`, `Error`, `Fatal`, `YourCustomLevel`
Max Length: `32`

The default level passed along with every log sent through this instance.

##### mac

_**Optional**_
Type: `String`
Default: `''`
Values: `C0:FF:EE:C0:FF:EE`

The default MAC Address passed along with every log sent through this instance.

##### max_length

_**Optional**_
Type: `Boolean`
Default: `true`

By default the line has a maximum length of 32000 chars, this can be turned off with the value false.

##### timeout

_**Optional**_
Type: `Integer`
Default: `180000`
Max Value: `300000`

The length of the timeout on the POST request that is sent to LogDNA.


### log(line, [options])

#### line

_**Required**_
Type: `String`
Default: `''`
Max Length: `32000`

The line which will be sent to the LogDNA system.

#### options

##### level

_**Optional**_
Type: `String`
Default: `Info`
Values: `Debug`, `Trace`, `Info`, `Warn`, `Error`, `Fatal`, `YourCustomLevel`
Max Length: `32`

The level passed along with this log line.

##### app

_**Optional**_
Type: `String`
Default: `''`
Values: `YourCustomApp`
Max Length: `32`

The app passed along with this log line.

##### meta

_**Optional**_
Type: `JSON`
Default: `null`

A meta object that provides additional context about the log line that is passed.

##### index_meta

_**Optional**_
Type: `Boolean`
Default: `false`

We allow meta objects to be passed with each line. By default these meta objects will be stringified and will not be searchable,
but will be displayed for informational purposes.

If this option is turned to true then meta objects will be parsed and will be searchable up to three levels deep. Any fields deeper than three levels will be stringified and cannot be searched.

*WARNING* When this option is true, your metadata objects across all types of log messages MUST have consistent types or the metadata object may not be parsed properly!

##### timestamp

_**Optional**_
Default: `Date.now()`

A timestamp in ms, must be within one day otherwise it will be dropped and Date.now() will be used in its place.

## Winston Transport

This module also provides a transport object, which can be added to winston using:

```javascript
var logdna = require('logdna');
var winston = require('winston');
var options = {
    key: apikey,
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    app: appName
};

// Defaults to false, when true ensures meta object will be searchable
options.index_meta = true;

// Only add this line in order to track exceptions
options.handleExceptions = true;

winston.add(winston.transports.Logdna, options);
```

## Bunyan Stream

This module also provides a transport object, which can be added to bunyan using:

```javascript
let LogDNAStream = require('logdna').BunyanStream;

let logDNA = new LogDNAStream({
  key: apikey
});

var logger = bunyan.createLogger({
  name: "My Application",
  streams: [
  	{ stream: process.stdout },
    { stream: logDNA,
      type: 'raw'
    }
  ]
});


logger.info('Starting application on port %d', app.get('port'));
```

*NOTE*: You _must_ use the `raw` stream type

## License

MIT © [LogDNA](https://logdna.com/)

*Happy Logging!*
