module.exports = {
    LOG_LEVELS: ['DEBUG', 'TRACE', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    DEFAULT_REQUEST_HEADER: { 'Content-Type': 'application/json; charset=UTF-8' },
    DEFAULT_REQUEST_TIMEOUT: 30000,
    MAX_REQUEST_TIMEOUT: 100000,
    MAX_LINE_LENGTH: 32000,
    MAX_INPUT_LENGTH: 32,
    FLUSH_INTERVAL: 250,
    FLUSH_LIMIT: 3000,
    BUF_LIMIT: 6000,
    MAX_SOCKETS: 20,
    MAC_ADDR_CHECK: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/,
    IP_ADDR_CHECK: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
};
