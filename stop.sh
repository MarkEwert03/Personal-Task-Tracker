#!/bin/bash

# This script stops a process listening on a specified port.
# Usage: ./stop.sh <PORT_NUMBER>

PORT=$1

if [ -z "$PORT" ]; then
  echo "Usage: ./stop.sh <PORT_NUMBER>"
  exit 1
fi

echo "Attempting to stop process on port $PORT..."
lsof -t -i :$PORT | xargs kill
echo "Process on port $PORT stopped (if it was running)."
