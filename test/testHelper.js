/* eslint-disable no-console */
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
    apikey: '< YOUR INGESTION KEY HERE >'
    , apikey2: '< YOUR 2ND INGESTION KEY HERE >'
    , apikey3: '< YOUR 3D INGESTION KEY HERE >'
    , apikey4: '< YOUR 4ND INGESTION KEY HERE >'
    , myHostname: 'AWESOMEHOSTER'
    , macAddress: 'C0:FF:EE:C0:FF:EE'
    , ipAddress: '10.0.1.101'
    , filename: 'testing.log'
    , testLength: 10000
    , options: {
        key: '< YOUR INGESTION KEY HERE >'
        , hostname: 'AWESOMEHOSTER'
        , ip: '10.0.1.101'
        , mac: 'C0:FF:EE:C0:FF:EE'
        , app: 'testing.log'
        , test: true
        , logdna_url: 'http://localhost:1337'
    }
    , options2: {
        key: '< YOUR 2ND INGESTION KEY HERE >'
        , hostname: 'AWESOMEHOSTER2'
        , ip: '10.0.1.101'
        , mac: 'C0:FF:EE:C0:FF:EE'
        , app: 'testing2.log'
        , test: true
        , logdna_url: 'http://localhost:1338'
    }
    , options3: {
        key: '< YOUR 3ND INGESTION KEY THEREEEEE >'
        , hostname: 'AWESOMEHOSTER'
        , ip: '10.0.1.101'
        , mac: 'C0:FF:EE:C0:FF:EE'
        , app: 'testing.log'
        , test: true
        , logdna_url: 'http://localhost:1339'
    }
    , options4: {
        key: '< YOUR 4ND INGESTION KEY HERE >'
        , hostname: 'AWESOMEHOSTER'
        , ip: '10.0.1.101'
        , mac: 'C0:FF:EE:C0:FF:EE'
        , app: 'testing.log'
        , test: true
        , logdna_url: 'http://localhost:1337'
    }
};

module.exports.memoryChecker = function(func) {
    var m1 = process.memoryUsage();

    console.time('    sendLogz');
    var p = func();
    console.timeEnd('    sendLogz');
    var m2 = process.memoryUsage();
    console.log('    Diff (MB) = rss: %j, heapTotal: %j, heapUsed: %j \n', (m2.rss - m1.rss) / 1000000, (m2.heapTotal - m1.heapTotal) / 1000000, (m2.heapUsed - m1.heapUsed) / 1000000);
    return p;
};

module.exports.arraysEqual = function(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) {
            console.log('FAIL a: %j, b: %j', a[i], b[i]);
            return false;
        }
    }
    return true;
};
module.exports.createOptions = function({
    key = '< YOUR INGESTION KEY HERE >'
    , hostname = 'AWESOMEHOSTER'
    , ip = '10.0.1.101'
    , mac = 'C0:FF:EE:C0:FF:EE'
    , app = 'testing.log'
    , test = true
    , port = 1337
} = {}) {
    return {
        key: key
        , hostname: hostname
        , ip: ip
        , mac: mac
        , app: app
        , test: test
        , logdna_url: `http://localhost:${port}`
    };
};
