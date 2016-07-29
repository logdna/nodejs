process.env.test = 'test';
var winston = require('winston');
var winstonLogdna = require('../lib/winston');
var testHelper = require('./testHelper');
var assert = require('assert');
var http = require('http');
var testLength = testHelper.testLength;
var linesReceived = 0;
var testStr = 'ESOTERIC ';
var body = '';
var testServer;

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
        winston.add(winston.transports.Logdna, testHelper.options);
        winston.remove(winston.transports.Console);
        testHelper.memoryChecker(sendWinston);
    });
});
