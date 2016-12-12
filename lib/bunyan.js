'use strict';

var util = require('util');

var EventEmitter = require('events').EventEmitter;
var Logger = require('./logger').Logger;

const levels = {
    10: 'TRACE'
    , 20: 'DEBUG'
    , 30: 'INFO'
    , 40: 'WARN'
    , 50: 'ERROR'
    , 60: 'FATAL'
};

/*
 *  Support for Bunyan Transport
 */
class BunyanStream extends EventEmitter {
    constructor(options) {
        super();

        options = options || {};

        this.logger = new Logger(options.key, options);
    }

    write(record) {

        // LogDNA adds their own - lets assume the time delta is trivial
        // record['timestamp'] = record.time;

        var message = record.msg;

        var opts = {
            level: levels[record.level]
            , app: record.name
            , context: record
        };

        // remove duplicate fields
        delete record.level;
        delete record.timestamp;
        delete record.name;
        delete record.msg;

        try {
            this.logger.log(message, opts);
        } catch (err) {
            this.emit('error', err);
        }
    };
}

module.exports.BunyanStream = BunyanStream;
