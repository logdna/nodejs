# Migrating to 4.x (and above)
----

For most people, migrating from earlier versions to 4.x (and above) will be relatively simple. The primary
breaking change is the removal of callbacks in the client, which have been replaced by `EventEmitter` events.
Other changes include the removal of cleanup functions for multiple client instances and the deprecation
of several configuration properties.

## Removal of Callbacks
The `log` method used to accept a callback, and that has been removed.  This shouldn't be a problem for most
upgrades since it was undocumented.  In any case, if you were using callbacks before, just move to using events.  
See below for examples.

## Log Instances are not Tracked
The previous versions would track log instances created with `createLogger()` in a privately-scoped variable in the
client.  Its primary use was to support the `flushAll` and `cleanUpAll` functions which have been removed, so the
client will no longer do this.  If you're only using a single instance of the logger, then this change does not affect you.

If you are creating multiple instances of the logger, you will want to make sure they're independently cleared
(by using the `cleared` event) upon shutdown, but that's really just a best practice.

## Removed Functions
The following functions were removed

* `flushAll` - This is no longer necessary because the client does not track multiple instances
* `cleanUpAll` - This is no longer necessary for the same reasons as `flushAll`

If you were using these functions, then they are easily replaced by calling `flush` manually, and awaiting the `cleared`
event as described in our [Best Practices](../README#best-practices) recommendations.

## `options` Key Name Changes
All keys for supported options are now lowerCamelCase for consistency.  Old names have been deprecated and will still
work, but a `console.warn` will be printed to inform the user to update them.  This is a list of those key name changes:

* `logdna_url` is now just `url`
* `index_meta` is now `indexMeta`
* `with_credentials` is now `withCredentials`
* `max_length` is no longer an option and will throw if used

## What it Looks Like Now
```javascript
const {once} = require('events')
const {createLogger} = require('@logdna/node-client')

const logger = createLogger('<YOUR KEY HERE>')

// All events are optional, but an `error` is recommended
logger.on('error', console.error)
logger.on('warn', console.warn)

async function clearLogging() {
  logger.flush()
  await once(logger, 'cleared')
  // Everything clear.  Did Lambda buffer anything?
  await sleep(1000)
  logger.flush()
  await once(logger, 'cleared')
  return
}

logger.log('some log line')

clearLogging().then(() => {
  // All lines have been sent
}).catch(() => {})  
```
