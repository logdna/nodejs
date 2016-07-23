/**
 *	LogDNA NPM Module Tests
 *		- Testing the LogDNA Node Code Library
 *		- TDD-style using Mocha and built-in assert library
 *      - Run with the following command:
 *          mocha --timeout 10000 LDNodeLibraryTests.js
 *
 *  +++++++++++++++++++++++++++++++++++++++++++++++++++++++
 *
 *      Benchmarks
 *          Total Lines |  Throughput (lines/s) | RSS (Mb)
 *          10000       |        213215         | 15.1
 *          100000      |        465260         | 15.2
 *          1000000     |        709915         | 94.6
 *
 *          *Averaged over 5 tests on local machine w/ Node 5.0:
 *              - MacBook Air (13-inch, Mid 2011)
 *              - 1.7GHz Intel Core i5
 *              - 4 Gb 1333 MHz DDR3
 */
module.exports = {
    apikey: 'd8e14421399a44a9a35dfc49c7f5f0aa',
    myHostname: 'AWESOMEHOSTER',
    macAddress: 'C0:FF:EE:C0:FF:EE',
    ipAddress: '10.0.1.101',
    filename: 'testing.log',
    testLength: 1000000,
    options: {
        key: 'd8e14421399a44a9a35dfc49c7f5f0aa',
        hostname: 'AWESOMEHOSTER',
        ip: '10.0.1.101',
        mac: 'C0:FF:EE:C0:FF:EE',
        app: 'testing.log',
        test: true
    }
};

module.exports.memoryChecker = function(func) {
    var m1 = process.memoryUsage();
    console.time('    sendLogz');
    func();
    console.timeEnd('    sendLogz');
    var m2 = process.memoryUsage();
    console.log('    Diff (MB) = rss: %j, heapTotal: %j, heapUsed: %j \n', (m2.rss - m1.rss) / 1000000, (m2.heapTotal - m1.heapTotal) / 1000000, (m2.heapUsed - m1.heapUsed) / 1000000);
};

module.exports.arraysEqual = function(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length != b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i])  {
            console.log('FAIL a: %j, b: %j', a[i], b[i]);
            return false;
        }
    }
    return true;
};
