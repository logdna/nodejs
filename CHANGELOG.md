# CHANGELOG

This file documents all notable changes in `LogDNA Node.js Code Library`. The release numbering uses [semantic versioning](http://semver.org).

## Next Release [MAJOR]
- Breaking Change: Add support for custom properties by adding `shimProperties` option when creating an logger. In order to continue to see fields `appOverride`, `logSourceCRN`, and `saveServiceCopy` in the message, need to add those properties in `shimProperties` like the following:
```javascript
const Logger = require('logdna');
const options = {
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    app: appName,
    env: envName,
    shimProperties: ['appOverride', 'logSourceCRN', 'saveServiceCopy']
};
const logger = Logger.createLogger(apikey, options);

logger.log('My Sample Log Line', {
    appOverride: true,
    logSourceCRN: 'good',
    saveServiceCopy: false
});
```

## v3.3.3 - September 20, 2019
- Add User Agent to the Request Header

## v3.3.2 - September 8, 2019
- Support for the following fields: `appOverride`, `logSourceCRN`, and `saveServiceCopy`

## v3.3.1 - September 3, 2019
- Metadata Support Bug Fix

## v3.3.0 - August 20, 2019
- HTTP Exception Handling
- Default Metadata Support
