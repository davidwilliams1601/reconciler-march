#!/bin/bash

# Exit on error
set -e

echo "Starting Render build process..."
echo "Current directory: $(pwd)"

# Set API URL explicitly
export REACT_APP_API_URL="https://reconciler-march.onrender.com/api"
echo "REACT_APP_API_URL: $REACT_APP_API_URL"

# Debug environment variables
echo "Environment variables:"
env | grep REACT_APP

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
echo "Using REACT_APP_API_URL: $REACT_APP_API_URL"
REACT_APP_API_URL=$REACT_APP_API_URL npm run build

echo "Build completed successfully!" 