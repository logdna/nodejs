module.exports = {
    create: require('./lib/logger').createLogger
  , WinstonTransport: require('./lib/winston').WinstonTransport
};
