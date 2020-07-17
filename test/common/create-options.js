'use strict'

module.exports = function createOptions({
  key = '< YOUR INGESTION KEY HERE >'
, hostname = 'AWESOMEHOSTER'
, ip = '10.0.1.101'
, mac = 'C0:FF:EE:C0:FF:EE'
, app = 'testing.log'
, test = true
, port = 1337
, failedBufRetentionLimit = null
, retryTimes = null
, retryTimeout = null
, flushInterval = 1 // Immediate flushing should be the default
, flushLimit = null
, max_length = null
, index_meta = null
, level = null
, tags = null
, protocol = null
, timeout = null
, shimProperties
} = {}) {
  return {
    key
  , hostname
  , ip
  , mac
  , app
  , test
  , logdna_url: `http://localhost:${port}`
  , failedBufRetentionLimit
  , retryTimeout
  , flushInterval
  , flushLimit
  , max_length
  , index_meta
  , level
  , retryTimes
  , tags
  , protocol
  , timeout
  , shimProperties
  }
}
