module.exports = {
    LOG_LEVELS: ['Debug', 'Info', 'Notice', 'Warning', 'Err', 'Crit', 'Alert', 'Emerg'],
    HEADER: { 'Content-Type': 'application/json; charset=UTF-8' },
    MAX_LINE_LENGTH: 32000,
    FLUSH_INTERVAL: 250,
    REQ_TIMEOUT: 30000,
    FLUSH_LIMIT: 3000,
    BUF_LIMIT: 6000,
    MAX_SOCKETS: 20
};
