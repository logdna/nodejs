'use strict';

let util = require('util');

let EventEmitter = require('events').EventEmitter;
let Logger = require('./logger').Logger;

let stringify = require('json-stringify-safe');

const levels = {
	10: 'trace',
	20: 'debug',
	30: 'info',
	40: 'warn',
	50: 'error',
	60: 'fatal'
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

		let opts = {};
		opts.level = levels[record.level];
		opts.app = record.name;

		// LogDNA adds their own - lets assume the time delta is trivial
		// record['timestamp'] = record.time;

		let message = record.msg;

		// remove duplicate fields
		delete record.level;
		delete record.timestamp;
		delete record.name;
		delete record.msg;

		try {

			message = message + ' \n' + stringify(record, null, 2, function() { return undefined; });

			this.logger.log(message, opts);
		} catch(err) {
			this.emit('error', err);
		}
	};
}

module.exports.BunyanStream = BunyanStream;
