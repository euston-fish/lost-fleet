#!/bin/bash

set -e

SOURCE='index.js'

mkdir -p target

uglifyjs --compress --output target/index.min.js -- "$SOURCE"

zip -r target final.zip

size="$(stat -c%s final.zip)"

echo "Size is $size"
if [ $size -gt 13312 ]; then
  echo "Too big!"
  exit 1
fi
