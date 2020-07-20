'use strict'

const http = require('http')
const {test} = require('tap')
const {createLogger} = require('../index.js')

const TOTAL_LINES = 100000
let httpCalls = 0
let linesReceived = 0
let sendEvents = 0
let errorEvents = 0

const server = http.createServer((req, res) => {
  let buffer = ''
  req.on('data', (data) => {
    buffer += data
  })
  req.on('end', () => {
    const body = JSON.parse(buffer)
    if (++httpCalls % 2 === 0) {
      res.statusCode = 500
      res.end('POOF - The request should be retried')
      return
    }
    linesReceived += body.ls.length
    res.statusCode = 200
    res.end('Ingested')
  })
})

test('Load test to ensure no data loss and expected payloads', async (t) => {
  const line = 'x'.repeat(500)

  t.test('Start a local HTTP server', (tt) => {
    server.listen(0)
    server.on('listening', tt.end)
  })

  t.test(`Test ${TOTAL_LINES} lines`, (tt) => {
    const logger = createLogger('<YOUR KEY HERE>', {
      retryTimes: 100
    , baseBackoffMs: 100
    , maxBackoffMs: 500
    , url: `http://localhost:${server.address().port}`
    })

    logger.on('send', (evt) => {
      sendEvents++
      tt.match(evt, {
        httpStatus: 200
      , firstLine: line
      , lastLine: line
      , totalLinesSent: Number
      , totalLinesReady: Number
      , bufferCount: Number
      }, 'send event payload is correct')
    })

    logger.on('error', (evt) => {
      errorEvents++
      tt.match(evt, {
        meta: {
          actual: 'Request failed with status code 500'
        , code: 500
        , firstLine: line
        , lastLine: line
        , retrying: true
        , attempts: 1 // We will not fail twice in a row in this test
        }
      }, 'Error event is correct', evt)
    })

    logger.on('cleared', () => {
      tt.pass('\'cleared\' event received!')
      // Based on the payload size, and the given instantiation options for
      // buffer size, etc, we can know how many HTTP calls and events we
      // can expect to have happened.
      tt.equal(linesReceived, TOTAL_LINES, 'Lines sent equals lines received')
      tt.equal(httpCalls, 19, 'HTTP call count (including errors) is correct')
      tt.equal(sendEvents, 10, '\'send\' event count does not include errors')
      tt.equal(errorEvents, 9, 'Expected error count')
      logger.removeAllListeners()
      server.close(() => {
        tt.end()
      })
    })

    for (let i = 0; i < TOTAL_LINES; i++) {
      logger.info(line)
    }
  })
})
