var Logger = require('../lib/logger');
var testHelper = require('./testHelper');
var assert = require('assert');
var http = require('http');

var logger = Logger.createLogger(testHelper.apikey, testHelper.options);
var testLength = testHelper.testLength;
var linesReceived = 0;
var testStr = 'ESOTERIC ';
var ordered = [];
var sent = [];
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
        testHelper.memoryChecker(sendLogs);
    });

    it('Proper Order', function(done) {
        assert(testHelper.arraysEqual(ordered, sent));
        done();
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
