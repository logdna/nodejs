#!/bin/bash
mkdir -p coverage
tap

code=$?
cat .tap-output | ./node_modules/.bin/tap-parser -t -f | ./node_modules/.bin/tap-xunit > coverage/test.xml
exit $code
