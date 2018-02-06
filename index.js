var logger = require('./lib/logger');

var __singleton;

var setupDefaultLogger = function(key, opts) {
    if (!(__singleton instanceof logger.Logger)) {
        __singleton = logger.createLogger(key, opts);
    }
    return __singleton;
};

module.exports = {
    cleanUpAll: logger.cleanUpAll
    , createLogger: logger.createLogger
    , flushAll: logger.flushAll
    , Logger: logger.Logger
    , setupDefaultLogger: setupDefaultLogger
};
