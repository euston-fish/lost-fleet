#!/bin/bash

echo "Building"
./build.sh
npm start &
NPM_PID=$!

fswatch --event Updated -e "^.*\.sw.$" -e "[0-9][0-9][0-9][0-9]$" -r -o src | while read event
do
  echo "Building"
  ./build.sh
  echo "Killing old process"
  kill $NPM_PID
  echo "Starting new process"
  npm start &
  NPM_PID=$!
done
