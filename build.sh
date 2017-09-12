#!/bin/bash

set -e
shopt -s extglob

MINIFY=google-closure-compiler-js
# `npm bin`/uglifyjs
SRC="src"
TARGET="public"
force=false
uglify_opts=''

while [ $# -gt 0 ]; do
  arg="$1"
  shift

  case $arg in
    -m|--minify)
      uglify_opts='-c -m'
    ;;
    -d|--debug)
      uglify_opts='-b'
    ;;
    -f|--force)
      force=true
    ;;
    *)
    ;;
  esac
done

BLUE='\033[00;34m'
NONE='\033[0m'
debug() {
  >&2 echo -e "${BLUE}build.sh: $@${NONE}"
}

older_than() {
  local target="$1"
  shift
  if [ ! -e "$target" ]; then # target hasn't been created
    debug "$target doesn't exist"
    return 0
  fi
  local f
  for f in "$@"; do
    if [ "$f" -nt "$target" ]; then # dependency is newer than target
      debug "$target is outdated"
      return 0
    fi
  done
  return 1  # target exists and is newer than dependencies
}

debug "starting"

mkdir -p $TARGET
rm -f $TARGET/!(*client.js|*server.js|*shared.js|index.html)

# for group in shared.js client.js server.js index.html; do
#   case $group in
#     *.js)
#       sources="$SRC/*$group"
#       target="$TARGET/$group"
#       if $force || older_than $target $sources; then
#         debug "rebuilding $group"
#         $UGLIFY $uglify_opts -- $sources > $target
#       fi
#     ;;
#     *.html)
#       sources="$SRC/$group"
#       target="$TARGET/$group"
#       if $force || older_than $target -- $sources; then
#         debug "rebuilding $group"
#         cat $sources > $target
#       fi
#     ;;
#     *)
#       debug "Don't know what to do for $group, skipping..."
#     ;;
#   esac
# done

$MINIFY --compilationLevel=ADVANCED $SRC/*.js > $TARGET/shared.js
echo '' > $TARGET/client.js
echo '' > $TARGET/server.js

debug "complete"
