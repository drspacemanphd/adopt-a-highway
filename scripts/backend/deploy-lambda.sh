#!/bin/bash
set -e

cd backend

if [ -z $COMMIT_HASH ]; then
  COMMIT_HASH="build"
fi

S3_BUCKET=adopt-a-highway-$ENV-lambda-function-code-10071987

for dir in ./*; do
  name=$(echo $dir | cut -c 3-)
  echo DEPLOYING LAMBDA: $name
  aws s3api put-object --bucket $S3_BUCKET --key $name-$COMMIT_HASH.zip --body ./$name/$name-$COMMIT_HASH.zip
done

cd ..