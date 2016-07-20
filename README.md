# nodejs
Node.js library for logging to LogDNA

### LogDNA NPM Module Tests
* Testing the LogDNA Node Code Library
* TDD-style using Mocha and built-in assert library
* Run with the following command:
    * mocha --timeout 10000 LDNodeLibraryTests.js

+++++++++++++++++++++++++++++++++++++++++++++++++++++++

### Benchmarks
   **Total Lines**  |  **Throughput** (lines/s) | **RSS** (Mb)
    10000            |        213215             | 15.1
    100000           |        465260             | 15.2
    1000000          |        709915             | 94.6

   *Averaged over 5 tests on local machine w/ Node 5.0:*
   * MacBook Air (13-inch, Mid 2011)
   * 1.7GHz Intel Core i5
   * 4 Gb 1333 MHz DDR3
