<p align="center">
  <a href="https://app.logdna.com">
    <img height="95" width="201" src="https://raw.githubusercontent.com/logdna/artwork/master/logo%2Bnode.png">
  </a>
  <p align="center">Node.js library for logging to <a href="https://app.logdna.com">LogDNA</a></p>
</p>

===

* **[Install](#install)**
* **[Setup](#setup)**
* **[Usage](#usage)**
* **[API](#api)**
* **[Winston Transport](#winston-transport)**
* **[Benchmarks](#benchmarks)**
* **[License](#license)**


## Install

```javascript
$ npm install --save-dev logdna
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
var logger = Logger.createLogger(apikey, options);
```
_**Required**_ - *(String)* - max length 32 chars
* [LogDNA API Key](https://app.logdna.com/manage/profile) 
* Hostname
* MAC Address
* IP Address

## Usage

After initial setup, logging is as easy as:
```javascript
// Simplest use case
logger.log('My Sample Log Line');

// Add a custom level
logger.log('My Sample Log Line', 'MyCustomLevel');

// Include an App name with this specific log
logger.log('My Sample Log Line', { level: 'Warn', app: 'myAppName'});
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
```

## API

### createLogger(key, [options])

#### key

Type: `String`  
Values: `YourAPIKey`   
Max Length: `32`  

The [LogDNA API Key](https://app.logdna.com/manage/profile) associated with your account.

#### options

##### hostname

Type: `String`  
Default: `''`  
Values: `YourCustomHostname`  
Max Length: `32`  

The default hostname passed along with every log sent through this instance.

##### mac

Type: `String`  
Default: `''`  
Values: `C0:FF:EE:C0:FF:EE`  

The default MAC Address passed along with every log sent through this instance.

##### ip

Type: `String`  
Default: `''`  
Values: `10.0.0.1`

The default IP Address passed along with every log sent through this instance.

##### timeout

Type: `Integer`  
Default: `30000`  
Max Value: `100000`

The length of the timeout on the POST request that is sent to LogDNA.

##### level

Type: `String`  
Default: `''`  
Values: `Debug`, `Trace`, `Info`, `Warn`, `Error`, `Fatal`, `YourCustomLevel`  
Max Length: `32`

The default level passed along with every log sent through this instance.

##### app

Type: `String`  
Default: `''`  
Values: `YourCustomApp`  
Max Length: `32`

The default app passed along with every log sent through this instance.

### log(line, [options])

#### line

Type: `String`  
Default: `''`  
Max Length: `32000`

The line which will be sent to the LogDNA system.

#### options

##### level

Type: `String`  
Default: `''`  
Values: `Debug`, `Trace`, `Info`, `Warn`, `Error`, `Fatal`, `YourCustomLevel`  
Max Length: `32`

The level passed along with this log line.

##### app

Type: `String`  
Default: `''`  
Values: `YourCustomApp`  
Max Length: `32`

The app passed along with this log line.


## Winston Transport

This module also provides a transport object, which can be added to winston using:

```javascript
var winston = require('winston');
var options = {
    key: apikey,
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    app: appName
};
winston.add(winston.transports.Logdna, options);
```



## Benchmarks
| **Total Lines** | **Throughput** *(lines/s)* | **RSS** *(MB)* |
|-----------------|----------------------------|----------------|
|      10,000     |          213,215           |      15.1      |
|      100,000    |          465,260           |      15.2      |
|      1,000,000  |          709,915           |      94.6      |

   *Averaged over 5 tests on local machine w/ Node 5.0:*
   * MacBook Air (13-inch, Mid 2011)
   * 1.7GHz Intel Core i5
   * 4 Gb 1333 MHz DDR3

## License

MIT © [LogDNA](https://logdna.com/)
