#!/bin/bash

# Exit on error
set -e

echo "Starting Render build process..."
echo "Current directory: $(pwd)"

# Print environment variables for debugging
echo "REACT_APP_API_URL: $REACT_APP_API_URL"

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
REACT_APP_API_URL=$REACT_APP_API_URL npm run build

echo "Build completed successfully!" 