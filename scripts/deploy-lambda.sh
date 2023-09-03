#!/bin/bash
set -e

cd backend

if [ -z $COMMIT_HASH ]; then
  COMMIT_HASH="build"
fi

S3_BUCKET=amplify-adoptahighway-dev-53135-deployment
S3_PREFIX=amplify-builds

for dir in ./*; do
  name=$(echo $dir | cut -c 3-)
  echo DEPLOYING LAMBDA: $name

  aws s3api put-object --bucket $S3_BUCKET --key $S3_PREFIX/$name-$COMMIT_HASH.zip --body ./$name/$name-$COMMIT_HASH.zip
done

cd ..