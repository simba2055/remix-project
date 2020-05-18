#!/usr/bin/env bash

set -e

setupRemixd () {
  SHAREDDIR="/apps/remix-ide/contracts"
  echo 'sharing folder: '
  echo $PWD$SHAREDDIR
  remixd -s $PWD$SHAREDDIR --remix-ide http://127.0.0.1:8080 & ls
  cd $PWD
}

BUILD_ID=${CIRCLE_BUILD_NUM:-${TRAVIS_JOB_NUMBER}}
echo "$BUILD_ID"
TEST_EXITCODE=0

npm run ganache-cli &
npm run serve &
setupRemixd

sleep 5

npm run nightwatch_parallel || TEST_EXITCODE=1
npm run nightwatch_local_runAndDeploy || TEST_EXITCODE=1

echo "$TEST_EXITCODE"
if [ "$TEST_EXITCODE" -eq 1 ]
then
  exit 1
fi
