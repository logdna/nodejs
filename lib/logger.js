/**
 *  LogDNA NPM Module
 *      - supports levels (Debug, Info, Notice, Warning, Error, Critical, Alert, Emerge)
 *      - supports winston
 */

var Agent = require('agentkeepalive');
var sizeof = require('object-sizeof');
var configs = require('./configs');
var request = require('request');
var util = require('util');
var debug = util.debuglog('logdna');
var _ = require('lodash');

function isInt(value) {
    return !isNaN(value) && (function(x) { return (x | 0) === x; })(parseFloat(value));
}

function checkParam(param, name, optional) {
    if (optional && !param) return;
    if (!param || !_.isString(param)) {
        throw new Error(name + ' is undefined or not passed as a String');
    } else if (param.length > configs.MAX_INPUT_LENGTH) {
        throw new Error(name + ' cannot be longer than ' + configs.MAX_INPUT_LENGTH + ' chars');
    }
}

// function getBytes(string) {
//     return Buffer.byteLength(string, 'utf8');
// }

function Logger(key, options) {
    if (!(this instanceof Logger)) return new Logger(key, options);
    checkParam(key, 'LogDNA API Key', false);
    checkParam(options.hostname, 'Hostname', false);
    checkParam(options.mac, 'MAC Address', false);
    checkParam(options.ip, 'IP Address', false);
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
    if (!configs.MAC_ADDR_CHECK.test(options.mac)) {
        throw new Error('Invalid MAC Address format');
    }
    if (!configs.IP_ADDR_CHECK.test(options.ip)) {
        throw new Error('Invalid IP Address format');
    }
    if (options.test && options.test === true) {
        this._url = configs.TEST_URL;
        this._agent = new Agent({
            maxSockets: configs.MAX_SOCKETS,
            keepAliveTimeout: configs.KEEP_ALIVE_TIMEOUT
        });
    } else {
        this._url = configs.LOGDNA_URL;
        this._agent = new Agent.HttpsAgent({
            maxSockets: configs.MAX_SOCKETS,
            keepAliveTimeout: configs.KEEP_ALIVE_TIMEOUT
        });
    }

    this._req = request.defaults({
        auth: { username: key },
        agent: this._agent,
        headers: configs.DEFAULT_REQUEST_HEADER,
        qs: {
            hostname: options.hostname,
            mac: options.mac,
            ip: options.ip
        },
        timeout: options.timeout || configs.DEFAULT_REQUEST_TIMEOUT
    });

    this._buf = [];
    this._bufByteLength = 0;
    this._err;

    this.source = {
        hostname: options.hostname || '',
        app: options.app || '',
        level: options.level || ''
    };
}

Logger.prototype.log = function(statement, opts) {
    this._err = false;
    var message = {
        timestamp: Date.now(),
        line: statement,
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
                this._err = true;
                debug('Can only pass a String or JSON object as additional parameter');
            }
            message.level = opts.level || message.level;
            message.app = opts.app || message.app;
        }
    }
    if (this._err) {
        return this._err;
    }
    this._bufferLog(message);
};

Logger.prototype._bufferLog = function(message) {
    if (!message || !message.line) return;

    if (message.line.length > configs.MAX_LINE_LENGTH) {
        message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
        debug('Line was longer than ' + configs.MAX_LINE_LENGTH + ' chars and was truncated.');
    }

    this._bufByteLength += sizeof(message);
    // this._bufLength += getBytes(JSON.stringify(message));

    this._buf.push(message);

    if (this._bufByteLength >= configs.FLUSH_BYTE_LIMIT) {
        this._flush();
        return;
    }

    if (!this._flusher) {
        this._flusher = setTimeout(_.bind(this._flush, this), configs.FLUSH_INTERVAL);
    }


};

Logger.prototype._flush = function() {
    if (!this._req || this._buf.length === 0) { return; }

    var sendbuf = { e: 'ls', ls: this._buf };
    var data = JSON.stringify(sendbuf);

    this._bufByteLength = 0;
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
        opts = opts || {};
        opts.level = level;
        this.log(statement, opts);
    };
});

exports.Logger = Logger;
exports.createLogger = function(key, options) {
    return new Logger(key, options);
};
