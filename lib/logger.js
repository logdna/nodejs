/**
 *  LogDNA NPM Module
 *      - supports levels (Debug, Info, Notice, Warning, Error, Critical, Alert, Emerge)
 *      - supports winston
 *      - Benchmarks at ~250k lines/s minimum
 */

var request = require('request');
var Agent = require('agentkeepalive');
var configs = require('./configs');
var codependency = require('codependency');
var message = {};
var flushtimeout;
var apps = '';
var buf = [];
const requirePeer = codependency.register(module);

const winston = requirePeer('winston', {
    optional: true
});

// if (winston) {
//     Logger.prototype.initWinston(winston);
// }

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
}

Logger.prototype.bufferLog = function(message) {
    if (message.line.length > configs.MAX_LINE_LENGTH) {
        message.line = message.line.substring(0, configs.MAX_LINE_LENGTH) + ' (cut off, too long...)';
    }

    buf.push(message);

    if (buf.length >= configs.FLUSH_LIMIT) {
        clearTimeout(flushtimeout);
        Logger.prototype.flush();
    }
};

Logger.prototype.log = function(statement, logLevel, app) {
    message = {
        timestamp: Date.now(),
        line: statement,
        level: logLevel || '',
        file: app || apps
    };
    Logger.prototype.bufferLog(message);
};

Logger.prototype.flush = function() {
    flushtimeout = setTimeout(Logger.prototype.flush, configs.FLUSH_INTERVAL);
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

Logger.prototype.debug = function(statement, filename) {
    Logger.prototype.log(statement, 'Debug', filename);
};

Logger.prototype.info = function(statement, filename) {
    Logger.prototype.log(statement, 'Info', filename);
};

Logger.prototype.notice = function(statement, filename) {
    Logger.prototype.log(statement, 'Notice', filename);
};

Logger.prototype.warning = function(statement, filename) {
    Logger.prototype.log(statement, 'Warning', filename);
};

Logger.prototype.warn = function(statement, filename) {
    Logger.prototype.log(statement, 'Warn', filename);
};

Logger.prototype.error = function(statement, filename) {
    Logger.prototype.log(statement, 'Error', filename);
};

Logger.prototype.err = function(statement, filename) {
    Logger.prototype.log(statement, 'Err', filename);
};

Logger.prototype.critical = function(statement, filename) {
    Logger.prototype.log(statement, 'Critical', filename);
};

Logger.prototype.crit = function(statement, filename) {
    Logger.prototype.log(statement, 'Crit', filename);
};

Logger.prototype.alert = function(statement, filename) {
    Logger.prototype.log(statement, 'Alert', filename);
};

Logger.prototype.emerg = function(statement, filename) {
    Logger.prototype.log(statement, 'Emerg', filename);
};

module.exports = Logger;
