/* eslint-env mocha */
/* eslint-disable no-console */
var delay = require('delay');

process.env.test = 'test';
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
var sentMeta = [];
var body = '';
var testServer;
var testServer2;

for (var i = 0; i < testLength; i++) {
    ordered.push(testStr);
}


var sendLogs = function() {
    var rssProfile = [];
    var base = process.memoryUsage().rss / 1000000.0;
    rssProfile.push(process.memoryUsage().rss / (1000000.0) - base);
    var start = process.hrtime();
    for (var i = 0; i < testLength; i++) {
        logger.log(testStr);
    }
    var elapsed = (process.hrtime(start)[0] * 1000) + process.hrtime(start)[1] / 1000000;
    var throughput = testLength / (elapsed / 1000);
    throughput = Math.round(throughput * 100) / 100;
    console.log('  ********************\n    Here\'s the throughput: %j lines/sec', throughput);
    return delay(configs.FLUSH_INTERVAL + 200);
};

describe('Test all Levels', function() {
    beforeEach(function(done) {
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
        testServer.on('listening', done);
        testServer.listen(1337);
    });
    afterEach(function(done) {
        testServer.close();
        testServer.on('close', function() {
            testServer = null;
            done();
        });
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
    beforeEach(function(done) {
        testServer = http.createServer(function(req, res) {
            body = '';
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    sentLines.push(body.ls[i].line);
                }
                res.end('Hello, world!\n');
            });
            req.on('error', (err) => {
                console.log('Got an error: ' + err);
            });
        });
        testServer.on('listening', done);
        testServer.listen(1337);
    });
    afterEach(function(done) {
        testServer.close();
        testServer.on('close', function() {
            testServer = null;
            done();
        });
        sentLines = [];
        body = '';
    });
    it('Exact Matches and Proper Order', function(done) {
        var p = testHelper.memoryChecker(sendLogs);
        p.then(() => {
            assert(testHelper.arraysEqual(ordered, sentLines));
            done();
        }).catch(done);
    });
});

describe('Index meta', function() {
    beforeEach(function(done) {
        testServer = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    sentMeta.push(body.ls[i].meta);
                }
                body = '';
            });
            res.end('Hello, world!\n');
        });
        testServer.on('listening', done);
        testServer.listen(1337);
    });
    afterEach(function(done) {
        testServer.close();
        testServer.on('close', function() {
            testServer = null;
            done();
        });
        sentMeta = [];
        body = '';
    });
    it('Doesn\'t index meta by default', function(done) {
        logger.debug('Sent a log', { meta: { extra_info: 'extra info' }});
        setTimeout(function() {
            assert(typeof sentMeta[0] === 'string');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Index meta if specified in logger options', function(done) {
        var opts = { index_meta: true, ...testHelper.options};
        var indexMetaLogger = Logger.createLogger(testHelper.apikey, opts);

        indexMetaLogger.debug('Sent a log', { meta: { extra_info: 'extra info' }});
        setTimeout(function() {
            assert(typeof sentMeta[0] === 'object');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Index meta if specified in message', function(done) {
        logger.debug('Sent a log', {
            index_meta: true
            , meta: { extra_info: 'extra info' }
        });
        setTimeout(function() {
            assert(typeof sentMeta[0] === 'object');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Doesn\'t index meta if specified in message even if logger option is true', function(done) {
        var opts = { index_meta: true, ...testHelper.options};
        var indexMetaLogger = Logger.createLogger(testHelper.apikey, opts);

        indexMetaLogger.debug('Sent a log', {
            index_meta: false
            , meta: { extra_info: 'extra info' }
        });
        setTimeout(function() {
            assert(typeof sentMeta[0] === 'string');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
});

describe('Input validation', function() {
    var bogusKeys;
    var options;
    var noOptions;
    beforeEach(function() {
        bogusKeys = [
            'THIS KEY IS TOO LONG THIS KEY IS TOO LONG THIS KEY IS TOO LONG THIS KEY IS TOO LONG THIS KEY IS TOO LONG THIS KEY IS TOO LONG'
            , 1234
            , { key: 'fail fail' }
            , 12.123
        ];
        options = {
            hostname: 'Valid Hostname'
            , mac: 'C0:FF:EE:C0:FF:EE'
            , ip: '10.0.1.101'
        };
        noOptions = {
            status: 'ok'
        };
    });
    it('Sanity checks for Ingestion Key', function(done) {
        for (var i = 0; i < bogusKeys.length; i++) {
            assert.throws(function() { Logger.createLogger(bogusKeys[i], options); }, Error, 'Invalid Keys');
        }
        done();
    });
    it('Sanity checks for option hostname', function(done) {
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {hostname: 'This is invalid'}); }, Error);
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {hostname: 123}); }, Error);
        done();
    });
    it('Sanity checks for option mac address', function(done) {
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {mac: 'This is invalid'}); }, Error);
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {mac: 3123132123}); }, Error);
        done();
    });
    it('Sanity checks for option ip address', function(done) {
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {ip: '1234.1234.1234'}); }, Error);
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {ip: 238741248927349}); }, Error);
        done();
    });
    it('Sanity checks for option logDNA URL', function(done) {
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {logdna_url: 'invalid url'}); }, Error);
        assert.throws(function() { Logger.createLogger(testHelper.apikey, {ip: 238741248927349}); }, Error);
        done();
    });
    it('Sanity checks for no options', function(done) {
        assert(Logger.createLogger(testHelper.apikey, noOptions));
        done();
    });
    it('Input Validation for logs', function(done) {
        assert(logger.log('asdasdadasd', 1234));
        assert(!logger.log('asdasdadasd', {}));
        done();
    });
});

describe('Multiple loggers', function() {
    const logger1 = Logger.createLogger(testHelper.apikey, testHelper.options);
    const logger2 = Logger.createLogger(testHelper.apikey2, testHelper.options2);
    const sentLines1 = [];
    const sentLines2 = [];

    beforeEach(function(done) {
        testServer = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                    sentLines1.push(body.ls[i].line);
                }
                body = '';
            });
            res.end('Hello, world!\n');
        });

        testServer2 = http.createServer(function(req, res) {
            req.on('data', function(data) {
                body += data;
            });
            req.on('end', function() {
                body = JSON.parse(body);
                for (var i = 0; i < body.ls.length; i++) {
                  console.log("*******")
                    console.log(body.ls[i].line)
                    sentLines2.push(body.ls[i].line);
                }
                body = '';
            });
            res.end('Hello, world!\n');
        });

        testServer.on('listening', function() {
            testServer2.on('listening', done);
        });

        testServer.listen(1337);
        testServer2.listen(1338);
    });
    afterEach(function(done) {
        testServer.close();
        testServer.on('close', function() {
            testServer = null;
            testServer2.close();
            testServer2.on('close', function() {
                testServer2 = null;
                done();
            });
        });
        body = '';
    });
    it('retain individual apikeys', function(done) {
        logger1.info('Sent a log');
        logger2.info('Sent a log2');
        assert.notDeepEqual(logger1._req.headers, logger2._req.headers, 'Multiple loggers should use their individual apikeys');

        setTimeout(function() {
            assert(sentLines1[0] === 'Sent a log');
            assert(sentLines2[0] === 'Sent a log2');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('retain individual urls', function(done) {
        logger1.info('Sent a log');
        logger2.info('Sent a log2');
        assert.notEqual(logger1._url, logger2._url, 'Multiple loggers should use their individual urls');
        setTimeout(function() {
            assert(sentLines1[0] === 'Sent a log');
            assert(sentLines2[0] === 'Sent a log2');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('retain individual source data', function(done) {
        logger1.info('Sent a log');
        logger2.info('Sent a log2');
        assert.notDeepEqual(logger1._req.qs, logger2._req.qs, 'Multiple loggers should use their individual source data');
        setTimeout(function() {
            assert(sentLines1[0] === 'Sent a log');
            assert(sentLines2[0] === 'Sent a log2');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
});
