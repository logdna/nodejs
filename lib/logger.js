/**
 *  LogDNA NPM Module
 *      - supports levels (Debug, Info, Notice, Warning, Error, Critical, Alert, Emerge)
 *      - supports Winston
 *      - supports Bunyan
 */

var os = require('os');
var request = require('request');
var sizeof = require('object-sizeof');
var stringify = require('json-stringify-safe');
var util = require('util');
var debug = util.debuglog('logdna');
var bind = require('lodash.bind');
var isEqual = require('lodash.isequal');
var forEach = require('lodash.foreach');

var configs = require('./configs');

var loggers = [];

function isInt(value) {
    return !isNaN(value) && ((parseFloat(value) | 0) === parseFloat(value));
}

function checkParam(param, name, optional) {
    if (optional && !param) return;
    if (!param || typeof param !== 'string') {
        throw new Error(name + ' is undefined or not passed as a String');
    } else if (param.length > configs.MAX_INPUT_LENGTH) {
        throw new Error(name + ' cannot be longer than ' + configs.MAX_INPUT_LENGTH + ' chars');
    }
}

function isValidTimestamp(timestamp) {
    var valid = (new Date(timestamp)).getTime() > 0;
    if (!valid || Math.abs(timestamp - Date.now()) > configs.MS_IN_A_DAY) {
        debug('Error: The timestamp used is either invalid or not within one day. Date.now() will be used in its place.');
        return false;
    }
    return true;
}

function Logger(key, options) {
    if (!(this instanceof Logger)) return new Logger(key, options);
    checkParam(key, 'LogDNA Ingestion Key', false);
    checkParam(options.hostname, 'Hostname', true);
    checkParam(options.mac, 'MAC Address', true);
    checkParam(options.ip, 'IP Address', true);
    checkParam(options.level, 'Level', true);
    checkParam(options.app, 'App', true);
    if (options.timeout) {
        if (!isInt(options.timeout)) {
            throw new Error('Timeout must be an Integer');
        }
        if (options.timeout > configs.MAX_REQUEST_TIMEOUT) {
            throw new Error('Timeout cannot be longer than' + configs.MAX_REQUEST_TIMEOUT);
        }
    }
    if (options.mac && !configs.MAC_ADDR_CHECK.test(options.mac)) {
        throw new Error('Invalid MAC Address format');
    }
    if (options.ip && !configs.IP_ADDR_CHECK.test(options.ip)) {
        throw new Error('Invalid IP Address format');
    }

    this._max_length = options.max_length || true;
    this._index_meta = options.index_meta || false;
    this._flushLimit = configs.FLUSH_BYTE_LIMIT;
    this._url = configs.LOGDNA_URL;
    var protocol = configs.AGENT_PROTOCOL;
    this._agent = new protocol(configs.AGENT_SETTING);
    this._bufByteLength = 0;
    this._buf = [];

    this.source = {
        hostname: options.hostname || os.hostname()
        , app: options.app || 'default'
        , level: options.level || 'INFO'
        , env: options.env || undefined
    };

    this._req = request.defaults({
        auth: { username: key }
        , agent: this._agent
        , headers: configs.DEFAULT_REQUEST_HEADER
        , qs: {
            hostname: this.source.hostname
            , mac: options.mac
            , ip: options.ip
        }
        , timeout: options.timeout || configs.DEFAULT_REQUEST_TIMEOUT
    });
    loggers.push(this);
}

Logger.prototype.log = function(statement, opts) {
    this._err = false;
    if (typeof statement === 'object') {
        statement = JSON.parse(JSON.stringify(statement));
        statement = stringify(statement, null, 2, function() { return undefined; });
    }
    var message = {
        timestamp: Date.now()
        , line: statement
        , level: this.source.level
        , app: this.source.app
        , env: this.source.env
    };
    if (opts) {
        if (typeof opts === 'string') {
            if (opts.length > configs.MAX_INPUT_LENGTH) {
                debug('Level had more than ' + configs.MAX_INPUT_LENGTH + ' chars, was truncated');
                opts = opts.substring(0, configs.MAX_INPUT_LENGTH);
            }
            message.level = opts;
        } else {
            if (typeof opts !== 'object') {
                this._err = true;
                debug('Can only pass a String or JSON object as additional parameter');
            }
            message.level = opts.level || message.level;
            message.app = opts.app || message.app;
            message.env = opts.env || message.env;
            if (opts.timestamp && isValidTimestamp(opts.timestamp)) {
                message.timestamp = opts.timestamp;
            }
            if (opts.context && !opts.meta) {
                opts.meta = opts.context;
            }
            if (typeof opts.meta === 'object') {
                if (this._index_meta || opts.index_meta) {
                    message.meta = opts.meta;
                } else {
                    message.meta = stringify(opts.meta);
                }
            }
        }
    }
    if (this._err) {
        return this._err;
    }
    this._bufferLog(message);
};

Logger.prototype._bufferLog = function(message) {
    if (!message || !message.line) {
        debug('Ignoring empty message');
        return;
    }

    if (this._max_length && message.line.length > configs.MAX_LINE_LENGTH) {
        message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
        debug('Line was longer than ' + configs.MAX_LINE_LENGTH + ' chars and was truncated.');
    }

    this._bufByteLength += sizeof(message);

    debug('Buffering message: %s', message.line);
    this._buf.push(message);

    if (this._bufByteLength >= this._flushLimit) {
        debug('Buffer size meets (or exceeds) flush limit.  Immediately flushing');
        this._flush();
        return;
    }

    if (!this._flusher) {
        debug('No scheduled flush. Scheduling for %d ms from now.', configs.FLUSH_INTERVAL);
        this._flusher = setTimeout(bind(this._flush, this), configs.FLUSH_INTERVAL);
    }
};

Logger.prototype._flush = function(cb) {
    if (!this._req || this._buf.length === 0) {
        debug('Nothing to flush');
        return cb && cb();
    }

    var sendbuf = { e: 'ls', ls: this._buf };
    var data = stringify(sendbuf);

    // BEFORE we clear the buffer, capture the lines being flushed for debug output
    var dbgLines = this._buf.map(function(msg) { return msg.line; });

    this._bufByteLength = 0;
    this._buf.length = 0;

    this._req.post(this._url, {
        body: data
        , qs: { now: Date.now() }
    }, function(err, httpResponse, body) {
        if (err) {
            debug('Encountered an Error in POST Request: %j', err);
        } else {
            debug('API success: %j', {
                lines: dbgLines,
                httpStatus: httpResponse.statusCode,
                body: body
            });
        }
        cb && cb(err);
    });
    clearTimeout(this._flusher);
    this._flusher = null;
};

Logger.prototype._cleanUp = function(cb) {
    this._flush(cb);
    for (var i = 0; i < loggers.length; i++) {
        if (isEqual(loggers[i], this)) {
            loggers.splice(i, 1);
            return;
        }
    }
};

/*
 *  Populate short-hand for each supported Log Level
 */
forEach(configs.LOG_LEVELS, function(level) {
    var l = level.toLowerCase();
    Logger.prototype[l] = function(statement, opts) {
        opts = opts || {};
        opts.level = level;
        this.log(statement, opts);
    };
});

var flushAll = function(cb) {
    var expectedCallbacks = loggers.length;
    function callback() {
        if (expectedCallbacks-- < 1) cb();
    }
    if (!expectedCallbacks) {
        cb();
    } else {
        for (var i = 0; i < loggers.length; i++) {
            loggers[i]._flush(callback);
        }
    }
};

exports.Logger = Logger;

exports.createLogger = function(key, options) {
    var next = new Logger(key, options);
    loggers.push(next);
    return next;
};

exports.flushAll = flushAll;
exports.cleanUpAll = function(cb) {
    flushAll(cb);
    loggers = [];
};
