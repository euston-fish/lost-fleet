#!/bin/bash

set -e

SOURCE='index.js'

mkdir -p target

uglifyjs --compress --output target/index.min.js -- "$SOURCE"

zip -r final.zip target

size="$(stat -c%s final.zip)"

echo "Size is $size"
if [ $size -gt 13312 ]; then
  echo "Too big!"
  exit 1
fi
