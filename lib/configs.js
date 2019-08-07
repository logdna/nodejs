module.exports = {
    LOG_LEVELS: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
    , DEFAULT_REQUEST_HEADER: { 'Content-Type': 'application/json; charset=UTF-8' }
    , DEFAULT_REQUEST_TIMEOUT: 180000
    , MS_IN_A_DAY: 86400000
    , MAX_REQUEST_TIMEOUT: 300000
    , MAX_LINE_LENGTH: 32000
    , MAX_INPUT_LENGTH: 80
    , FLUSH_INTERVAL: 250
    , FLUSH_BYTE_LIMIT: (process.env.test === 'test') ? 320000 : 5000000
    , AGENT_SETTING: (process.env.test === 'test') ? { maxSockets: 20, keepAliveTimeout: 1000 } : { maxSockets: 20, keepAliveTimeout: 60000 }
    , AGENT_PROTOCOL: (process.env.test === 'test') ? 'http' : 'https'
    , LOGDNA_URL: 'https://logs.logdna.com/logs/ingest'
    , HOSTNAME_CHECK: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
    , MAC_ADDR_CHECK: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/
    , IP_ADDR_CHECK: /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    , REQUEST_WITH_CREDENTIALS: false
    , BACKOFF_PERIOD: 3000
    , FAILED_BUF_RETENTION_LIMIT: 320000
};
