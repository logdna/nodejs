# nodejs
Node.js library for logging to LogDNA

**Must reach flushlimit to send logs**
* Add a timeout to eventually send logs if flushlimit is never reached
* Will slow down the code to set timeouts after the last log sent

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
