/**
 *	LogDNA NPM Module Tests
 *		- Testing the LogDNA Node Code Library
 *		- TDD-style using Mocha and built-in assert library
 *      - Run with the following command:
 *          mocha --timeout 10000 LDNodeLibraryTests.js
 *
 *  +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *
 *      Benchmarks
 *          Total Lines |  Throughput (lines/s) | RSS (Mb)
 *          10000       |        213215         | 15.1
 *          100000      |        465260         | 15.2
 *          1000000     |        709915         | 94.6
 *
 *          *Averaged over 5 tests on local machine w/ Node 5.0:
 *              - MacBook Air (13-inch, Mid 2011)
 *              - 1.7GHz Intel Core i5
 *              - 4 Gb 1333 MHz DDR3
 */

var memwatch = require('memwatch-next');
var winston = require('winston');
var Logger = require('../lib/logger');
var assert = require('assert');
var http = require('http');
var logURL = 'http://localhost:1337';
// var logURL = 'https://logs.logdna.com/logs/ingest';
var apikey = 'd8e14421399a44a9a35dfc49c7f5f0aa';
var myHostname = 'AWESOMEHOSTER';
var macAddress = 'C0:FF:EE:C0:FF:EE';
var ipAddress = '10.0.1.101';
var filename = 'testing.log';
var options = {
    key: apikey,
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    logurl: logURL,
    app: filename
};
var logger = Logger.createLogger(apikey, options);
var testLength = 1000000;
var linesReceived = 0;
var testStr = 'ESOTERIC ';
var ordered = [];
var sent = [];
var body = '';
var testServer;

memwatch.on('stats', function(stats) {
    // console.log('Here\'s garbage collection: %j', stats);
});
memwatch.on('leak', function(info) {
    console.log('Here\'s leak info: %j', info);
    assert(false);
});
for (var i = 0; i < testLength; i++) {
    ordered.push(testStr);
}

var memoryChecker = function(func) {
    var m1 = process.memoryUsage();
    console.time('    sendLogz');
    func();
    console.timeEnd('    sendLogz');
    var m2 = process.memoryUsage();
    console.log('    Diff (Mb) = rss: %j, heapTotal: %j, heapUsed: %j \n', (m2.rss - m1.rss) / 1000000, (m2.heapTotal - m1.heapTotal) / 1000000, (m2.heapUsed - m1.heapUsed) / 1000000);
};

var arraysEqual = function(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])  {
            console.log('FAIL a: %j, b: %j', a[i], b[i]);
            return false;
        }
    }
    return true;
};

var sendLogs = function() {
    var rssProfile = [];
    var base = process.memoryUsage().rss / 1000000.0;
    rssProfile.push(process.memoryUsage().rss / (1000000.0) -  base);
    var start = process.hrtime();
    for (var i = 0; i < testLength; i++) {
        logger.log(testStr);
        // logger.warn(testStr);
        // rssProfile.push(process.memoryUsage().rss / (1000000.0) - base);
    }
    var elapsed = (process.hrtime(start)[0] * 1000) + process.hrtime(start)[1] / 1000000;
    var throughput = testLength / (elapsed / 1000);
    throughput = Math.round(throughput * 100) / 100;
    console.log('  ********************\n    Here\'s the throughput: %j lines/sec', throughput); // , rssProfile[rssProfile.length-1] - rssProfile[0]);
};

var sendWinston = function() {
    var start = process.hrtime();
    for (var i = 0; i < testLength; i++) {
        winston.log('warn', testStr);
    }
    var elapsed = (process.hrtime(start)[0] * 1000) + process.hrtime(start)[1] / 1000000;
    var throughput = testLength / (elapsed / 1000);
    throughput = Math.round(throughput * 100) / 100;
    console.log('  ********************\n    Here\'s the throughput: %j lines/sec', throughput); // , rssProfile[rssProfile.length-1] - rssProfile[0]);
};

describe('Testing for Correctness', function() {
    after(function() {
        testServer.close();
    });
    it('Exact Matches', function(done) {
        // Setup Test Server
        testServer = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    sent.push(body.ls[i].line);
                    assert(body.ls[i].line.substring(0, 10) === ordered[linesReceived + i].substring(0, 10));
                }
                linesReceived += body.ls.length;
                body = '';
                if (linesReceived == testLength) {
                    linesReceived = 0;
                    done();
                }
            });
            res.end('Hello, world!\n');
        });
        testServer.listen(1337);
        memoryChecker(sendLogs);
    });

    it('Proper Order', function(done) {
        assert(arraysEqual(ordered, sent));
        done();
    });
});

describe('winstonTransport', function() {
    after(function() {
        testServer.close();
    });
    it('Builds winstonTransport and sends log messages through it', function(done) {
        testServer = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    assert(body.ls[i].line == testStr);
                }
                linesReceived += body.ls.length;
                body = '';
                if (linesReceived == testLength) {
                    linesReceived = 0;
                    done();
                }
            });
            res.end('Hello, world!\n');
        });
        testServer.listen(1337);
        winston.add(winston.transports.Logdna, options);
        winston.remove(winston.transports.Console);
        memoryChecker(sendWinston);
    });
});

describe('Input validation', function() {
    var bogusKeys;
    var options;
    var bogusOptions;
    beforeEach(function() {
        bogusKeys = [
            'THIS KEY IS TOO LONG THIS KEY IS TOO LONG THIS KEY IS TOO LONG',
            1234,
            { key: 'fail fail' },
            12.123
        ];
        options = {
            hostname: 'Valid Hostname',
            mac: 'Valid MAC Address',
            ip: 'Valid IP Address'
        };
        bogusOptions = {
            hostname: 123,
            mac: 3123132123,
            ip: 238741248927349
        };
    });
    it('Sanity checks for API Key', function(done) {
        for (var i = 0; i < bogusKeys.length; i++) {
            assert.throws(function() { Logger.createLogger(bogusKeys[i], options); }, Error);
        }
        done();
    });
    it('Sanity checks for options', function(done) {
        assert.throws(function() { Logger.createLogger(apikey, bogusOptions); }, Error);
        done();
    });
    it('Input Validation for logs', function(done) {
        assert.throws(function() { logger.log(1234); }, Error);
        assert.throws(function() { logger.log('asdasdadasd', 1234); }, Error);
        assert.throws(function() { logger.log('asdasdadasd', {}); }, Error);
        done();
    });
});
