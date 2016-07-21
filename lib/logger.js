/**
 *  LogDNA NPM Module
 *      - supports levels (Debug, Info, Notice, Warning, Error, Critical, Alert, Emerge)
 *      - supports winston
 *      - Benchmarks at ~250k lines/s minimum
 */

var util = require('util');
var debug = util.debuglog('logdna');
var request = require('request');
var Agent = require('agentkeepalive');
var _ = require('lodash');
var configs = require('./configs');
// var codependency = require('codependency');
// const requirePeer = codependency.register(module);
// const winston = requirePeer('winston', {
//     optional: true
// });
// if (winston) {
//     Logger.prototype.initWinston(winston);
// }
function Logger(options) {
    if (!(this instanceof Logger)) return new Logger(options);

    options = options || {};

    this._req = request.defaults({
        auth: { username: options.apikey },
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
        app: options.app || ''
    };
}

Logger.prototype.log = function(statement, level, app) {
    var message = {
        timestamp: Date.now(),
        line: statement,
        level: level || '',
        file: app || this.source.app
    };
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
        clearTimeout(this._flusher);
        this._flush();
    }
};

Logger.prototype._flush = function() {
    this._flusher = setTimeout(_.bind(this._flush, this), configs.FLUSH_INTERVAL);
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
};


// Logger.prototype.initWinston = function(winston) {
//     if (winston.transports.Logdna) return;

//     const Transport = winston.Transport;

//     class LogdnaTransport extends Transport {
//         constructor(opts) {
//             super(opts);
//             this.json = opts.json;

//             this[$Logger] = new Logger(opts);

//             this[$Logger].on('error', err => this.emit(err));
//         }

//         log(lvl, msg, meta, cb) {
//             if (this.json) {
//                 const message = {
//                     message: msg
//                 };
//                 if (!_.isEmpty(meta)) {
//                     if (_.isObject(meta))
//                         _.defaults(message, meta);
//                     else
//                         message.meta = meta;
//                 }

//                 this[$Logger].log(lvl, message);
//             } else {
//                 if (!_.isEmpty(meta)) {
//                     if (_.isString(msg))
//                         msg += ' ' + this[$Logger][$serialize](meta);

//                     else if (_.isObject(msg))
//                         msg[getSafeProp(msg, 'meta')] = meta;
//                 }

//                 this[$Logger].log(lvl, msg);
//             }

//             setImmediate(cb.bind(null, null, true));
//         }


//         get name() {
//             return 'logentries';
//         }


//         get level() {
//             const [, lvlName] =
//             this[$Logger][$toLevel](this[$Logger].minLevel);

//             return lvlName;
//         }
//         set level(val) {
//             if (!this[$Logger])
//                 this[$tempLevel] = val;
//             else
//                 this[$Logger].minLevel = val;
//         }

//         get levels() {
//             return this[$Logger].levels.reduce((acc, lvlName, lvlNum) => {
//                 acc[lvlName] = lvlNum;
//                 return acc;
//             }, {});
//         }
//     }

//     winston.transports.Logdna = LogdnaTransport;
// };

/*
 * Populate short-hand for each supported Log Level
 */
_.forEach(configs.LOG_LEVELS, function(level) {
    var l = level.toLowerCase();
    Logger.prototype[l] = function(statement, filename) {
        this.log(statement, level, filename);
    };
});

exports.Logger = Logger;
exports.createLogger = function(options) {
    return new Logger(options);
};
