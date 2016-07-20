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
var logURL;
var req;

module.exports.initialize = function(config) {
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
};

var bufferLog = function(message) {
    if (message.line.length > configs.MAX_LINE_LENGTH) {
        message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
    }

    buf.push(message);

    if (buf.length >= configs.FLUSH_LIMIT) {
        clearTimeout(flushtimeout);
        module.exports.flush();
    }
};

module.exports.log = function(statement, logLevel, app) {
    message = {
        timestamp: Date.now(),
        line: statement,
        level: logLevel || '',
        file: app || apps
    };
    bufferLog(message);
};

module.exports.flush = function() {
    flushtimeout = setTimeout(module.exports.flush, configs.FLUSH_INTERVAL);
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


module.exports.debug = function(statement, filename) {
    module.exports.log(statement, 'Debug', filename);
};

module.exports.info = function(statement, filename) {
    module.exports.log(statement, 'Info', filename);
};

module.exports.notice = function(statement, filename) {
    module.exports.log(statement, 'Notice', filename);
};

module.exports.warning = function(statement, filename) {
    module.exports.log(statement, 'Warning', filename);
};

module.exports.warn = function(statement, filename) {
    module.exports.log(statement, 'Warn', filename);
};

module.exports.error = function(statement, filename) {
    module.exports.log(statement, 'Error', filename);
};

module.exports.err = function(statement, filename) {
    module.exports.log(statement, 'Err', filename);
};

module.exports.critical = function(statement, filename) {
    module.exports.log(statement, 'Critical', filename);
};

module.exports.crit = function(statement, filename) {
    module.exports.log(statement, 'Crit', filename);
};

module.exports.alert = function(statement, filename) {
    module.exports.log(statement, 'Alert', filename);
};

module.exports.emerg = function(statement, filename) {
    module.exports.log(statement, 'Emerg', filename);
};
