#!/bin/bash

OC_USER=$(oc whoami)

if [ $? != 0 ] ; then
  echo "You must be logged into openshift to run this script."
  echo "try 'oc login -u developer'"
  exit 1
fi

echo "Logged in as ${OC_USER}."
oc project

echo "Building frontend"
cd frontend
npm install
echo "Deploying frontend"
npm run openshift

cd ..
open http://`oc get route nodejs-messaging-work-queue-frontend | tail -1 | cut -d ' ' -f 4`
