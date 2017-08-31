#!/bin/bash

set -e

./build.sh -m -f

rm -f final.zip
zip -q -9 -r final.zip public
#7z a -r final.zip public # enabling 7zip might get us a few extra bytes, if we can make sure it's acceptable

if [ $(uname) = Darwin ]; then
  flag=-f%z
else
  flag=-c%s
fi
size="$(stat $flag final.zip)"
(( percent = size * 100 / 13312 ))

echo "Size is $size"
if [ $size -gt 13312 ]; then
  echo "Too big!"
  exit 1
else
  echo "Percentage: $percent"
fi
