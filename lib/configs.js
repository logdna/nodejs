module.exports = {
    LOG_LEVELS: ['DEBUG', 'TRACE', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    DEFAULT_REQUEST_HEADER: { 'Content-Type': 'application/json; charset=UTF-8' },
    DEFAULT_REQUEST_TIMEOUT: 30000,
    MAX_LINE_LENGTH: 32000,
    FLUSH_INTERVAL: 250,
    FLUSH_LIMIT: 3000,
    BUF_LIMIT: 6000,
    MAX_SOCKETS: 20
};
