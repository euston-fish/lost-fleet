#!/bin/bash

PURPLE='\033[00;35m'
NONE='\033[0m'
debug() {
  >&2 echo -e "${PURPLE}run.sh: $@${NONE}"
}

rebuild_and_reload() {
  ./build.sh -b
  build_ret=$?
  if [ -n "$npm_pid" ]; then
    debug "killing old server"
    kill $npm_pid
    npm_pid=''
  fi
  if [ "$build_ret" -eq 0 ]; then
    debug "starting new server"
    npm start &
    npm_pid=$!
  else
    debug "build failed, not starting server"
  fi
};

debug "starting"
rebuild_and_reload

fswatch --event Updated -e "^.*\.sw.$" -e "[0-9][0-9][0-9][0-9]$" -r -o src | while read event
do
  rebuild_and_reload
done
