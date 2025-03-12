#!/bin/bash

# Exit on error
set -e

# Print current directory for debugging
echo "Current directory: $(pwd)"
echo "Listing directory contents:"
ls -la

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Clean up any previous builds
echo "Cleaning up..."
rm -rf /opt/render/project/src/frontend/build /opt/render/project/src/frontend/node_modules/.cache

# Remove node_modules
echo "Removing node_modules..."
rm -rf /opt/render/project/src/frontend/node_modules

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Navigate to frontend directory
echo "Changing to frontend directory..."
cd /opt/render/project/src/frontend

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

echo "Build completed!" 