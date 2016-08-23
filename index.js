module.exports = {
    createLogger: require('./lib/logger').createLogger,
    WinstonTransport: require('./lib/winston').WinstonTransport,
    BunyanStream: require('./lib/bunyan').BunyanStream
};
