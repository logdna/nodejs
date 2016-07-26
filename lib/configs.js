module.exports = {
    LOG_LEVELS: ['DEBUG', 'TRACE', 'INFO', 'WARN', 'ERROR', 'FATAL'],
    DEFAULT_REQUEST_HEADER: { 'Content-Type': 'application/json; charset=UTF-8' },
    DEFAULT_REQUEST_TIMEOUT: 30000,
    MAX_REQUEST_TIMEOUT: 100000,
    KEEP_ALIVE_TIMEOUT: 60000,
    MAX_LINE_LENGTH: 32000,
    MAX_INPUT_LENGTH: 32,
    FLUSH_INTERVAL: 250,
    FLUSH_BYTE_LIMIT: 320000,
    MAX_SOCKETS: 20,
    TEST_URL: 'http://localhost:1337',
    LOGDNA_URL: 'https://logs.logdna.com/logs/ingest',
    MAC_ADDR_CHECK: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/,
    IP_ADDR_CHECK: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
};
