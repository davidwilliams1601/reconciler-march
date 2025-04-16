#!/bin/bash

# Display current Node.js and npm versions
echo "Node.js version: $(node -v)"
echo "npm version: $(npm -v)"

# Clear npm cache
echo "Clearing npm cache..."
npm cache clean --force

# Clear build cache
echo "Removing old build artifacts..."
rm -rf node_modules/.cache
rm -rf build

# Install dependencies from scratch
echo "Installing dependencies..."
npm ci || npm install

# Build with a unique timestamp to force cache invalidation
echo "Building application with timestamp: $(date)"
REACT_APP_BUILD_TIME=$(date +%s) npm run build

echo "Build completed successfully at $(date)."
echo "Deployment should now be pushed to Render." 