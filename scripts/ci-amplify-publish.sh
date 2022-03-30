#!/bin/bash
set -e
IFS='|'

AMPLIFY_ENV=$ENV amplify publish --force --yes