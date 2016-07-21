/**
 *  LogDNA NPM Module
 *      - supports levels (Debug, Info, Notice, Warning, Error, Critical, Alert, Emerge)
 *      - supports winston
 *      - Benchmarks at ~250k lines/s minimum
 */

var Agent = require('agentkeepalive');
var configs = require('./configs');
var request = require('request');
var util = require('util');
var _ = require('lodash');
var debug = util.debuglog('logdna');
var winston = require('winston');


function Logger(key, options) {
    if (!(this instanceof Logger)) return new Logger(key, options);
    this.checkParam(key, 'LogDNA API Key');
    this.checkParam(options.hostname, 'Hostname');
    this.checkParam(options.mac, 'MAC Address');
    this.checkParam(options.ip, 'IP Address');

    options = options || {};

    this._req = request.defaults({
        auth: { username: key },
        agent: new Agent({
            maxSockets: configs.MAX_SOCKETS,
            keepAliveTimeout: configs.KEEP_ALIVE_TIMEOUT
        }),
        // agent: (new Agent.HttpsAgent({ maxSockets: configs.MAX_SOCKETS, keepAliveTimeout: configs.KEEP_ALIVE_TIMEOUT })),
        headers: configs.DEFAULT_REQUEST_HEADER,
        qs: {
            hostname: options.hostname,
            mac: options.mac,
            ip: options.ip
        },
        timeout: options.timeout || configs.REQ_TIMEOUT
    });
    this._url = options.logurl;
    this._buf = [];

    this.source = {
        host: options.hostname || '',
        app: options.app || '',
        level: options.level || ''
    };
}

Logger.prototype.checkParam = function(param, name) {
    if (!param || !_.isString(param)) {
        throw new Error(name + ' is undefined or not passed as a string');
    }
};

Logger.prototype.log = function(statement, opts) {
    var message = {
        timestamp: Date.now(),
        line: statement,
        level: this.source.level,
        app: this.source.app
    };
    if (opts) {
        if (_.isString(opts)) {
            message.level = opts;
        } else {
            message.level = opts.level;
            message.app = opts.app;
        }
    }
    this._bufferLog(message);
};

Logger.prototype._bufferLog = function(message) {
    if (!message || !message.line) {
        return;
    }

    if (message.line.length > configs.MAX_LINE_LENGTH) {
        message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
    }

    this._buf.push(message);

    if (!this._flusher) {
        this._flusher = setTimeout(_.bind(this._flush, this), configs.FLUSH_INTERVAL);
    }

    if (this._buf.length >= configs.FLUSH_LIMIT) {
        this._flush();
    }
};

Logger.prototype._flush = function() {
    if (!this._req || this._buf.length === 0) { return; }

    var sendbuf = { e: 'ls', ls: this._buf };
    var data = JSON.stringify(sendbuf);
    this._buf.length = 0;

    this._req.post(this._url, {
        body: data,
        qs: { now: Date.now() }
    }, function(err, response) {
        if (err) {
            debug('ERROR!!! %j', err);
        }
        if (response.statusCode == 200) {
            // console.log("OK STATUS");
        }
    });
    clearTimeout(this._flusher);
    this._flusher = null;
};

/*
 * Populate short-hand for each supported Log Level
 */
_.forEach(configs.LOG_LEVELS, function(level) {
    var l = level.toLowerCase();
    Logger.prototype[l] = function(statement, app) {
        var opts = {
            level: level,
            app: app
        };
        this.log(statement, opts);
    };
});

exports.Logger = Logger;
exports.createLogger = function(key, options) {
    return new Logger(key, options);
};

/*
 *  Support for Winston Transport
 */
var transport = exports.winstonTransport = winston.transports.Logdna = function(options) {
    this.name = options.name || 'LogDNALogger';
    this.level = options.level || '';
    winston.Transport.call(this, options);
    this.LogDNALogger = exports.createLogger(options.key, options);
};

util.inherits(transport, winston.Transport);

transport.prototype.log = function(level, msg, meta, callback) {
    var opts = meta;
    opts.level = level;
    this.LogDNALogger.log(msg, opts);
    callback(null, true);
};
