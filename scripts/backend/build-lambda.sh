#!/bin/bash
set -e

cd backend

if [ -z $COMMIT_HASH ]; then
  COMMIT_HASH="build"
fi

for dir in ./*; do
  echo BUILDING LAMBDA: $dir
  cd $dir
  rm -rf ./dist
  tsc -p tsconfig.json
  cp package.json ./dist
  cp yarn.lock ./dist
  yarn install --production --cwd=./dist
  cd ./dist
  zip -rv "../$dir-$COMMIT_HASH.zip" ./*
  cd ../..
done

cd ..