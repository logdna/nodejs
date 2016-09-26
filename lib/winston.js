var util = require('util');
var winston = require('winston');
var Logger = require('./logger').Logger;
var stringify = require('json-stringify-safe');

/*
 *  Support for Winston Transport
 */
var WinstonTransport = exports.WinstonTransport = function(options) {
    this.name = options.name || 'LogDNA';
    this.level = options.level || '';
    winston.Transport.call(this, options);
    this.logger = new Logger(options.key, options);
};

util.inherits(WinstonTransport, winston.Transport);

winston.transports.Logdna = WinstonTransport;

WinstonTransport.prototype.log = function(level, msg, meta, callback) {
    if (meta instanceof Error) { meta = { error: meta.stack || meta.toString() }; }

    if (!msg && !(Object.keys(meta).length === 0 && meta.constructor === Object)) {
        msg = stringify(meta, null, 2, function() { return undefined; });
    }
    var opts = {
        level: level,
        context: meta
    };
    this.logger.log(msg, opts);
    if (callback) { callback(null, true); }
};
