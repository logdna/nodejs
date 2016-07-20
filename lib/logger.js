/**
 *  LogDNA NPM Module
 *      - supports levels (Debug, Info, Notice, Warning, Error, Critical, Alert, Emerge)
 *      - supports winston
 *      - Benchmarks at ~250k lines/s minimum
 */

var request = require('request');
var Agent = require('agentkeepalive');
var configs = require('./configs');
var message = {};
var flushtimeout;
var apps = '';
var buf = [];

function Logger(config) {
    req = request.defaults({
        auth: { username: config.apikey },
        agent: (new Agent({ maxSockets: configs.MAX_SOCKETS, keepAliveTimeout: configs.KEEP_ALIVE_TIMEOUT })),
        // agent: (new Agent.HttpsAgent({ maxSockets: configs.MAX_SOCKETS, keepAliveTimeout: configs.KEEP_ALIVE_TIMEOUT })),
        headers: configs.HEADER,
        qs: { hostname: config.hostname, mac: config.mac, ip: config.ip },
        timeout: configs.REQ_TIMEOUT
    });
    if (config.app) {
        apps = config.app;
    }
    logURL = config.logurl;

    this.bufferLog = function(message) {
        if (message.line.length > configs.MAX_LINE_LENGTH) {
            message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
        }

        buf.push(message);

        if (buf.length >= configs.FLUSH_LIMIT) {
            clearTimeout(flushtimeout);
            this.flush();
        }
    };

    this.log = function(statement, logLevel, app) {
        message = {
            timestamp: Date.now(),
            line: statement,
            level: logLevel || '',
            file: app || apps
        };
        this.bufferLog(message);
    };

    this.flush = function() {
        flushtimeout = setTimeout(this.flush, configs.FLUSH_INTERVAL);
        if (buf.length === 0) return;
        if (!req) return;

        var sendbuf = { e: 'ls', ls: buf };
        var data = JSON.stringify(sendbuf);
        buf.length = 0;

        req.post(logURL, {
            body: data,
            qs: { now: Date.now() }
        }, function(err, httpResp) {
            if (err) {
                console.log('ERROR!!! %j', err);
            }
            if (httpResp.statusCode == 200) {
                // console.log("OK STATUS");
            }
        });
        sendbuf = null;
        data = null;
    };


    this.debug = function(statement, filename) {
        this.log(statement, 'Debug', filename);
    };

    this.info = function(statement, filename) {
        this.log(statement, 'Info', filename);
    };

    this.notice = function(statement, filename) {
        this.log(statement, 'Notice', filename);
    };

    this.warning = function(statement, filename) {
        this.log(statement, 'Warning', filename);
    };

    this.warn = function(statement, filename) {
        this.log(statement, 'Warn', filename);
    };

    this.error = function(statement, filename) {
        this.log(statement, 'Error', filename);
    };

    this.err = function(statement, filename) {
        this.log(statement, 'Err', filename);
    };

    this.critical = function(statement, filename) {
        this.log(statement, 'Critical', filename);
    };

    this.crit = function(statement, filename) {
        this.log(statement, 'Crit', filename);
    };

    this.alert = function(statement, filename) {
        this.log(statement, 'Alert', filename);
    };

    this.emerg = function(statement, filename) {
        this.log(statement, 'Emerg', filename);
    };
}

module.exports = Logger;
