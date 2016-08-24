'use strict';

var util = require('util');

let EventEmitter = require('events').EventEmitter;
var Logger = require('./logger').Logger;

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

		let message = record.message;

		// remove duplicate fields
		delete record.level;
		delete record.time;
		delete record.name;

		try {

			let message = message + ' ' + stringify(record, null, 2, function() { return undefined; });

			this.logger.log(record, opts);
		} catch(err) {
			this.emit('error', err);
		}
	};
}

module.exports.BunyanStream = BunyanStream;
