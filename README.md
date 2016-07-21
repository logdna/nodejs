# nodejs
Node.js library for logging to LogDNA

### Setup
##### Required
```
var Logger = require('logdna');
var options = {
    hostname: myHostname,
    ip: ipAddress,
    mac: macAddress,
    app: filename
};
var logger = Logger.createLogger(apikey, options);
```

* LogDNA API Key
* Hostname
* MAC Address
* IP Address



### Winston Transport

This module also provides a transport object, which can be added to winston using

```
winston.add(winston.transports.Logdna, options);
```

### Benchmarks
| **Total Lines** | **Throughput** *(lines/s)* | **RSS** *(Mb)* |
|-----------------|----------------------------|----------------|
|      10,000     |          213,215           |      15.1      |
|      100,000    |          465,260           |      15.2      |
|      1,000,000  |          709,915           |      94.6      |

   *Averaged over 5 tests on local machine w/ Node 5.0:*
   * MacBook Air (13-inch, Mid 2011)
   * 1.7GHz Intel Core i5
   * 4 Gb 1333 MHz DDR3
