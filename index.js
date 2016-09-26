var logger = require('./lib/logger');

var __singleton;

var setupDefaultLogger = function(key, opts) {
    if (!(__singleton instanceof logger.Logger)) {
        __singleton = logger.createLogger(key, opts);
    }
    return __singleton;
};

module.exports = {
    createLogger: logger.createLogger,
    WinstonTransport: logger.WinstonTransport,
    setupDefaultLogger: setupDefaultLogger
};
