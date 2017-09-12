#!/bin/bash

set -e
shopt -s extglob

MINIFY=`npm bin`/uglifyjs
SRC="src"
TARGET="public"
force=false
uglify_opts=''

SPECIFIC='Rn,Pw,Ef,Ac,De,Cp,Tr,Attack,Mine,Construct,Misc,command_unit,make_baby,move,attack,mine,construct,set_command,flames,body,Escape,Tab'
RESERVED="io,on,upgrade,transports,module,exports,emit,arena,$SPECIFIC"


while [ $# -gt 0 ]; do
  arg="$1"
  shift

  case $arg in
    -m|--minify)
      uglify_opts="-c -m reserved=[$RESERVED] --mangle-props reserved=[$RESERVED]"
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

$MINIFY $uglify_opts -- $SRC/*.js > $TARGET/shared.js
echo '' > $TARGET/server.js
cp $SRC/index.html $TARGET/index.html

debug "complete"
