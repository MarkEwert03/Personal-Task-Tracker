#!/bin/bash

# This script starts the client and server components of the application.

echo "Starting client..."
cd client && npm start &

echo "Starting server..."
cd ../server && node index.js &

echo "Application started. Client should be available at http://localhost:3000 (or similar) and server at http://localhost:8080 (or similar)."