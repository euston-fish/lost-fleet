#!/bin/bash

set -e

SOURCES='src/*'

UGLIFY_OPTS='-c -m'

rm -rf public
mkdir -p public

for file in $SOURCES
do
  case $file in
    *shared.js)
      SHARED_SOURCES="$SHARED_SOURCES $file"
    ;;
    *client.js)
      CLIENT_SOURCES="$CLIENT_SOURCES $file"
    ;;
    *server.js)
      SERVER_SOURCES="$SERVER_SOURCES $file"
    ;;
    *.js)
      uglifyjs $UGLIFY_OPTS --output public${file#src} -- $file
    ;;
    *)
      cp $file public${file#src}
    ;;
  esac
done

uglifyjs $UGLIFY_OPTS --output public/shared.js -- $SHARED_SOURCES
uglifyjs $UGLIFY_OPTS --output public/client.js -- $CLIENT_SOURCES
uglifyjs $UGLIFY_OPTS --output public/server.js -- $SERVER_SOURCES

rm -f final.zip
zip -9 -r final.zip public

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
