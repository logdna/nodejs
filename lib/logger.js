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
var debug = util.debuglog('logdna');
var winston = require('winston');
var _ = require('lodash');

function Logger(key, options) {
    if (!(this instanceof Logger)) return new Logger(key, options);
    this.checkParam(key, 'LogDNA API Key', false);
    this.checkParam(options.hostname, 'Hostname', false);
    this.checkParam(options.mac, 'MAC Address', false);
    this.checkParam(options.ip, 'IP Address', false);
    this.checkParam(options.level, 'Level', true);
    this.checkParam(options.app, 'App', true);
    if (options.timeout) {
        if (!isInt(options.timeout)) {
            throw new Error('Timeout must be an Integer');
        }
        if (options.timeout > configs.MAX_REQUEST_TIMEOUT) {
            throw new Error('Timeout cannot be longer than' + configs.MAX_REQUEST_TIMEOUT);
        }
    }
    if (!configs.MAC_ADDR_CHECK.test(options.mac)) {
        throw new Error('Invalid MAC Address format');
    }
    if (!configs.IP_ADDR_CHECK.test(options.ip)) {
        throw new Error('Invalid IP Address format');
    }

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
        hostname: options.hostname || '',
        app: options.app || '',
        level: options.level || ''
    };
}

function isInt(value) {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
}

Logger.prototype.checkParam = function(param, name, optional) {
    if (optional && !param) return;
    if (!param || !_.isString(param)) {
        throw new Error(name + ' is undefined or not passed as a String');
    } else if (param.length > configs.MAX_INPUT_LENGTH) {
        throw new Error(name + ' cannot be longer than ' + configs.MAX_INPUT_LENGTH + ' chars');
    }
};

Logger.prototype.log = function(statement, opts) {
    if (!statement || !_.isString(statement)) {
        throw new Error('Log function must be called with a line, passed as a String');
    }
    var message = {
        timestamp: Date.now(),
        line: statement,
        hostname: this.source.hostname,
        level: this.source.level,
        app: this.source.app
    };
    if (opts) {
        if (_.isString(opts)) {
            if (opts.length > configs.MAX_INPUT_LENGTH) {
                debug('Level had more than ' + configs.MAX_INPUT_LENGTH + ' chars, was truncated');
                opts = opts.substring(0, configs.MAX_INPUT_LENGTH);
            }
            message.level = opts;
        } else {
            if (typeof opts != 'object') {
                throw new Error('Can only pass a String or JSON object as additional parameter');
            }
            this.checkParam(opts.level, 'Level', false);
            this.checkParam(opts.hostname, 'Hostname', true);
            this.checkParam(opts.app, 'App', true);
            message.level = opts.level;
            message.hostname = opts.hostname || message.hostname;
            message.app = opts.app || message.app;
        }
    }
    this._bufferLog(message);
};

Logger.prototype._bufferLog = function(message) {
    if (!message || !message.line) return;

    if (message.line.length > configs.MAX_LINE_LENGTH) {
        message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
        debug('Line was longer than ' + configs.MAX_LINE_LENGTH + ' chars and was truncated.');
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
    }, function(err) {
        if (err) { debug('Encountered an Error in POST Request: %j', err); }
    });
    clearTimeout(this._flusher);
    this._flusher = null;
};

/*
 *  Populate short-hand for each supported Log Level
 */
_.forEach(configs.LOG_LEVELS, function(level) {
    var l = level.toLowerCase();
    Logger.prototype[l] = function(statement, opts) {
        opts.level = level;
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
    if (meta instanceof Error) { meta = { error: meta.stack || meta.toString() }; }
    var opts = meta;
    opts.level = level;
    this.LogDNALogger.log(msg, opts);
    if (callback) { callback(null, true); }
};
