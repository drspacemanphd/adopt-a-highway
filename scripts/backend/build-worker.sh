#!/bin/bash
set -e

cd workers

if [ -z $COMMIT_HASH ]; then
  COMMIT_HASH="build"
fi

for dir in ./*; do
  echo BUILDING WORKER: $dir
  cd $dir
  rm -rf ./dist
  npx esbuild index.ts --bundle --outdir=./dist --tsconfig=./tsconfig.json
  cd ..
done

cd ..