'use strict'

/**
 * This implements exponential backoff with "decorrelated jitter" for use in
 * failing HTTP calls and their retries.  Although the HTTP calls shouldn't be in
 * contention with other clients, the jitter will help alleviate a flood
 * of connections to the server in the event LogDNA suddenly comes back
 * online after being unavailable.
 *
 * @see https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/
 *
 * @param   {Number} base The base sleep time to be used
 * @param   {Number} cap The maximum sleep time allowable in milliseconds
 * @param   {Number} lastSleep The last (or starting) sleep time used
 * @returns {Number} calculated sleep time
 */

module.exports = function backoffWithJitter(base, cap, lastSleep) {
  const sleep = Math.min(
    cap
  , _randomBetween(base, lastSleep * 3)
  )
  return sleep
}

function _randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
