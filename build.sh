#!/bin/bash

set -e

older_than() {
  local target="$1"
  shift
  if [ ! -e "$target" ] # target hasn't been created
  then
    return 0
  fi
  local f
  for f in "$@"
  do
    if [ "$f" -nt "$target" ] # dependency is newer than target
    then
      return 0
    fi
  done
  return 1  # target exists and is newer than dependencies
}

SOURCES='src/*'

UGLIFY_OPTS='-c -m'
UGLIFY=`npm bin`/uglifyjs

#rm -rf public
# TODO: we never remove files from public now...
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
      older_than public${file#src} $file && $UGLIFY $UGLIFY_OPTS --output public${file#src} -- $file
    ;;
    *.swp)
    ;;
    *)
      cp $file public${file#src}
    ;;
  esac
done

older_than public/shared.js $SHARED_SOURCES && $UGLIFY $UGLIFY_OPTS --output public/shared.js -- $SHARED_SOURCES
older_than public/client.js $CLIENT_SOURCES && $UGLIFY $UGLIFY_OPTS --output public/client.js -- $CLIENT_SOURCES
older_than public/server.js $SERVER_SOURCES && $UGLIFY $UGLIFY_OPTS --output public/server.js -- $SERVER_SOURCES

if [ ! "$1" = skip ]
then
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
fi
