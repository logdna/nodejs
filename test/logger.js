/* eslint-env mocha */
/* eslint-disable no-console */
var delay = require('delay');
const sizeof = require('object-sizeof');
process.env.test = 'test';
var Logger = require('../lib/logger');
var testHelper = require('./testHelper');
var configs = require('../lib/configs');
var assert = require('assert');
var http = require('http');

var logger = Logger.createLogger(testHelper.apikey, testHelper.options);
var testLength = testHelper.testLength;
var testStr = 'ESOTERIC ';

/*
 * Var ordered = [];
 * var sentLines = [];
 * var sentLevels = [];
 */
var sentMeta = [];
var body = '';
var testServer;
var testServer2;


describe('Test all Levels', function() {
    const allLevelsPort = 8080;
    const options = testHelper.createOptions({port: allLevelsPort});
    const allLevelsLogger = Logger.createLogger(testHelper.apikey, options);
    let allLevelsServer;
    let sentLines = [];
    let sentLevels = [];
    beforeEach(function(done) {
        allLevelsServer = http.createServer(function(req, res) {
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
        allLevelsServer.on('listening', done);
        allLevelsServer.listen(allLevelsPort);
    });
    afterEach(function(done) {
        allLevelsServer.close();
        allLevelsServer.on('close', function() {
            allLevelsServer = null;
            done();
        });
        sentLines = [];
        sentLevels = [];
        body = '';
    });
    it('Debug Function', function(done) {
        allLevelsLogger.debug('Sent a log');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log');
            assert(sentLevels[0] === 'DEBUG');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Trace Function', function(done) {
        allLevelsLogger.trace('Sent a log1');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log1');
            assert(sentLevels[0] === 'TRACE');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Info Function', function(done) {
        allLevelsLogger.info('Sent a log2');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log2');
            assert(sentLevels[0] === 'INFO');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Warn Function', function(done) {
        allLevelsLogger.warn('Sent a log3');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log3');
            assert(sentLevels[0] === 'WARN');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Error Function', function(done) {
        allLevelsLogger.error('Sent a log4');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log4');
            assert(sentLevels[0] === 'ERROR');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('Fatal Function', function(done) {
        allLevelsLogger.fatal('Sent a log5');
        setTimeout(function() {
            assert(sentLines[0] === 'Sent a log5');
            assert(sentLevels[0] === 'FATAL');
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
});

describe('Testing for Correctness', function() {
    let correctnessServer;
    const correctnessPort = 1333;
    const opts = testHelper.createOptions({port: correctnessPort});
    const correctnesLogger = Logger.createLogger(testHelper.apikey, opts);

    let sentLines = [];
    const ordered = [];

    for (var i = 0; i < testLength; ++i) {
        ordered.push(testStr);
    }

    const sendLogs = function() {
        var rssProfile = [];
        var base = process.memoryUsage().rss / 1000000.0;
        rssProfile.push(process.memoryUsage().rss / (1000000.0) - base);
        var start = process.hrtime();
        for (let i = 0; i < testLength; ++i) {
            correctnesLogger.log(testStr);
        }
        var elapsed = (process.hrtime(start)[0] * 1000) + process.hrtime(start)[1] / 1000000;
        var throughput = testLength / (elapsed / 1000);
        throughput = Math.round(throughput * 100) / 100;
        console.log('  ********************\n    Here\'s the throughput: %j lines/sec', throughput);
        return delay(configs.FLUSH_INTERVAL + 200);
    };

    beforeEach(function(done) {
        correctnessServer = http.createServer(function(req, res) {
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
        correctnessServer.on('listening', done);
        correctnessServer.listen(correctnessPort);
    });
    afterEach(function(done) {
        correctnessServer.close();
        correctnessServer.on('close', function() {
            correctnessServer = null;
            done();
        });
        sentLines = [];
        body = '';
    });
    it('Exact Matches and Proper Order', function(done) {
        const promis = testHelper.memoryChecker(sendLogs);
        promis.then(() => {
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
    afterEach(function(done) {
        Logger.flushAll(done);
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
    var logger1 = Logger.createLogger(testHelper.apikey3, testHelper.options3);
    var logger2 = Logger.createLogger(testHelper.apikey2, testHelper.options2);
    var sentLines1 = [];
    var sentLines2 = [];
    let testServer3;
    beforeEach(function(done) {
        testServer3 = http.createServer(function(req, res) {
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
                    sentLines2.push(body.ls[i].line);
                }
                body = '';
            });
            res.end('Hello, world!\n');
        });

        testServer3.on('listening', function() {
            testServer2.on('listening', done);
        });

        testServer3.listen(1339);
        testServer2.listen(1338);
    });
    afterEach(function(done) {
        testServer3.close();
        testServer3.on('close', function() {
            testServer3 = null;
            testServer2.close();
            testServer2.on('close', function() {
                testServer2 = null;
                done();
            });
        });
        sentLines1 = [];
        sentLines2 = [];
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

describe('ambient meta', function() {
    const options = testHelper.createOptions();
    const ambientLogger = Logger.createLogger(testHelper.apikey, options);

    beforeEach(function() {
        Logger.flushAll();
    });

    it('add string ambinet meta to a string log line', function() {
        ambientLogger.addProperty('someAmbientMeta');
        ambientLogger.log('Sent a string log');
        ambientLogger.log('Sent a second string log');

        assert(ambientLogger._buf[0].line === '{"message":"Sent a string log","ambient_meta":"someAmbientMeta"}');
        assert(ambientLogger._buf[1].line === '{"message":"Sent a second string log","ambient_meta":"someAmbientMeta"}');
    });
    it('add an object ambinet meta to a string log line', function() {
        ambientLogger.addProperty({someAmbientKey: 'value'});

        ambientLogger.log('Sent a string log');
        ambientLogger.log('Sent a second string log');

        assert(ambientLogger._buf[0].line === '{"message":"Sent a string log","ambient_meta":{"someAmbientKey":"value"}}');
        assert(ambientLogger._buf[1].line === '{"message":"Sent a second string log","ambient_meta":{"someAmbientKey":"value"}}');
    });
    it('add an object ambinet meta to an object log line', function() {
        ambientLogger.addProperty({someAmbientKey: 'value'});

        ambientLogger.log({k: 'v'});

        assert(ambientLogger._buf[0].line === '{"message":"{\\n  \\"k\\": \\"v\\",\\n  \\"ambientMeta\\": {\\n    \\"someAmbientKey\\": \\"value\\"\\n  }\\n}","ambient_meta":{"someAmbientKey":"value"}}');
    });
    it('remove ambient meta', function() {
        ambientLogger.addProperty('someAmbientMeta');
        ambientLogger.log('Sent a string log');
        ambientLogger.removeProperty();
        ambientLogger.log('Sent a string log');
        assert(ambientLogger._buf[0].line === '{"message":"Sent a string log","ambient_meta":"someAmbientMeta"}');
        assert(ambientLogger._buf[1].line === 'Sent a string log');
    });
});

describe('HTTP Excpetion handling', function() {
    let httpExcServer;
    let countHits = 0;
    let statusCode = 302;
    let edgeCaseFlag = false;
    const port = 1336;
    const options = testHelper.createOptions({port: port});
    let whenSuccessConnection = 0;
    beforeEach(function(done) {
        httpExcServer = http.createServer(function(req, res) {
            if (edgeCaseFlag && countHits >= 1) {
                statusCode = 200;
                whenSuccessConnection = Date.now();
            }
            res.writeHead(statusCode, {'Content-Type': 'text/plain'});
            res.write('Hello World');
            res.end(() => {++countHits;});
        });
        httpExcServer.on('listening', done);
        httpExcServer.listen(port);
    });

    afterEach(function(done) {
        countHits = 0;
        httpExcServer.close();
        httpExcServer.on('close', function() {
            httpExcServer = null;
            done();
        });
        sentMeta = [];
        body = '';
        statusCode = 302;
        whenSuccessConnection = 0;
    });
    const httpExcLogger = Logger.createLogger(testHelper.apikey, options);

    it('when fails to connect, it should put the _isLoggingBackedOff flag on', function(done) {
        httpExcLogger.debug('The line');
        setTimeout(function() {
            assert(httpExcLogger._isLoggingBackedOff === true);
            assert(httpExcLogger._buf.length === 1);
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
    it('*!!depends on the previouce test!!* Send the log after the previouse one has failed', function(done) {
        this.timeout(3500);
        edgeCaseFlag = true;
        countHits = 1;
        const thisSendTime = Date.now();
        httpExcLogger.debug('The second line');
        setTimeout(function() {
            assert(whenSuccessConnection - thisSendTime >= configs.BACKOFF_PERIOD);
            assert(httpExcLogger._buf.length === 0);
            assert(httpExcLogger._isLoggingBackedOff === false);
            done();
        }, configs.BACKOFF_PERIOD + 200);
    });
    it('*!!depends on the previouce test!!* Should clear backoff after success', function(done) {
        this.timeout(3500);
        edgeCaseFlag = true;
        countHits = 1;
        const thisSendTime = Date.now();
        httpExcLogger.debug('The second line');
        setTimeout(function() {
            assert(whenSuccessConnection - thisSendTime < configs.BACKOFF_PERIOD);
            assert(httpExcLogger._buf.length === 0);
            assert(httpExcLogger._isLoggingBackedOff === false);
            done();
        }, configs.BACKOFF_PERIOD + 200);
    });
    it('should not exceed the failed buf retention limit', function(done) {
        this.timeout(3500);
        const opts = testHelper.createOptions({port: port, failedBufRetentionLimit: 1000});
        const tooManyFails = Logger.createLogger(testHelper.apikey, opts);

        for (let i = 0; i < 1000; ++i) {
            tooManyFails.debug('The second line');
        }
        setTimeout(function() {
            const byteSizeOfBuf = sizeof(tooManyFails._buf[0]) * tooManyFails._buf.length;
            assert(byteSizeOfBuf <= opts.failedBufRetentionLimit);
            done();
        }, configs.BACKOFF_PERIOD + 200);
    });
    it('flushAll should recieve err message', function(done) {
        const opts = testHelper.createOptions({port: port});
        const flushAllTest = Logger.createLogger(testHelper.apikey, opts);
        flushAllTest._buf = [{ timestamp: 1565221290289
                                ,line: 'The line'
                                ,level: 'DEBUG'
                                ,app: 'testing.log' } ];
        let errMes = '';

        flushAllTest._flush((err) => {errMes = err});

        setTimeout(function() {
            assert(errMes.includes('status code:'));
            done();
        }, configs.FLUSH_INTERVAL + 200);
    });
});
