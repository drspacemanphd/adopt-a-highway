#!/bin/bash
set -e

if [ -z $COMMIT_HASH ]; then
  COMMIT_HASH="build"
fi

S3_BUCKET=ada-frontend-application-dev
S3_PREFIX=/static-$COMMIT_HASH

echo DEPLOYING FRONTEND
aws s3 cp --recursive ./build s3://$S3_BUCKET$S3_PREFIX
aws s3 cp ./build/index.html s3://$S3_BUCKET/index-$COMMIT_HASH.html
