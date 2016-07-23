var Logger = require('../lib/logger');
var testHelper = require('./testHelper');
var configs = require('../lib/configs');
var assert = require('assert');
var http = require('http');

var logger = Logger.createLogger(testHelper.apikey, testHelper.options);
var testLength = testHelper.testLength;
var testStr = 'ESOTERIC ';
var ordered = [];
var sentLines = [];
var sentLevels = [];
var body = '';
var testServer;

for (var i = 0; i < testLength; i++) {
    ordered.push(testStr);
}

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

describe('Test all Levels', function() {
    beforeEach(function() {
        testServer = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    sentLines.push(body.ls[i].line);
                    sentLevels.push(body.ls[i].level);
                }
                body = '';
            });
            res.end('Hello, world!\n');
        });
        testServer.listen(1337);
    });
    afterEach(function() {
        testServer.close();
        testServer = null;
        sentLines = [];
        sentLevels = [];
        body = '';
    });
    it('Debug Function', function(done) {
        logger.debug('Sent a log');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log');
            assert(sentLevels[0] === 'DEBUG');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Trace Function', function(done) {
        logger.trace('Sent a log1');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log1');
            assert(sentLevels[0] === 'TRACE');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Info Function', function(done) {
        logger.info('Sent a log2');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log2');
            assert(sentLevels[0] === 'INFO');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Warn Function', function(done) {
        logger.warn('Sent a log3');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log3');
            assert(sentLevels[0] === 'WARN');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Error Function', function(done) {
        logger.error('Sent a log4');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log4');
            assert(sentLevels[0] === 'ERROR');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Fatal Function', function(done) {
        logger.fatal('Sent a log5');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log5');
            assert(sentLevels[0] === 'FATAL');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
});

describe('Testing for Correctness', function() {
    beforeEach(function() {
        testServer = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    sentLines.push(body.ls[i].line);
                }
                body = '';
            });
            res.end('Hello, world!\n');
        });
        testServer.listen(1337);
    });
    afterEach(function() {
        testServer.close();
        testServer = null;
        sentLines = [];
        body = '';
    });
    it('Exact Matches and Proper Order', function(done) {
        testHelper.memoryChecker(sendLogs);
        setTimeout(function() {
            assert(testHelper.arraysEqual(ordered, sentLines));
            done();
        }, 6000);
    });
});

describe('Input validation', function() {
    var bogusKeys;
    var options;
    var bogusOptions;
    var invalidOptions;
    beforeEach(function() {
        bogusKeys = [
            'THIS KEY IS TOO LONG THIS KEY IS TOO LONG THIS KEY IS TOO LONG',
            1234,
            { key: 'fail fail' },
            12.123
        ];
        options = {
            hostname: 'Valid Hostname',
            mac: 'C0:FF:EE:C0:FF:EE',
            ip: '10.0.1.101'
        };
        bogusOptions = {
            hostname: 123,
            mac: 3123132123,
            ip: 238741248927349
        };
        invalidOptions = {
            hostname: 'This Works',
            mac: 'This is invalid',
            ip: '1234.1234.1234'
        };
    });
    it('Sanity checks for API Key', function(done) {
        for (var i = 0; i < bogusKeys.length; i++) {
            assert.throws(function() { Logger.createLogger(bogusKeys[i], options); }, Error, 'Invalid Keys');
        }
        done();
    });
    it('Sanity checks for options', function(done) {
        assert.throws(function() { Logger.createLogger(testHelper.apikey, invalidOptions); }, Error);
        assert.throws(function() { Logger.createLogger(testHelper.apikey, bogusOptions); }, Error);
        done();
    });
    it('Input Validation for logs', function(done) {
        assert(logger.log('asdasdadasd', 1234));
        assert(!logger.log('asdasdadasd', {}));
        done();
    });
});
