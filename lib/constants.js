'use strict'

// Internal Modules
const pkg = require('../package.json')

module.exports = {
  AGENT_SETTING: {maxSockets: 20, freeSocketTimeout: 60000}
, BASE_BACKOFF_MILLIS: 3000
, MAX_BACKOFF_MILLIS: 30000
, DEFAULT_REQUEST_HEADER: {'Content-Type': 'application/json; charset=UTF-8'}
, DEFAULT_REQUEST_TIMEOUT: 5000
, USER_AGENT: `${pkg.name}/${pkg.version}`
, FLUSH_BYTE_LIMIT: 5000000
, FLUSH_INTERVAL_MS: 250
, HOSTNAME_CHECK: /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9-]*[A-Za-z0-9])$/
, LOG_LEVELS: ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL']
, LOGDNA_URL: 'https://logs.logdna.com/logs/ingest'
, MAC_ADDR_CHECK: /^([0-9a-fA-F][0-9a-fA-F]:){5}([0-9a-fA-F][0-9a-fA-F])$/
, MAX_INPUT_LENGTH: 80
, MAX_LINE_LENGTH: 32000
, MAX_REQUEST_TIMEOUT: 300000
, MS_IN_A_DAY: 86400000
, PROTOCOL_RE: /^https?:\/\//
, REQUEST_WITH_CREDENTIALS: false
, TAGS_RE: /\s*,\s*/
}
