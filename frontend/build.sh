#!/bin/bash

# Exit on error
set -e

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Clean up any previous builds
echo "Cleaning up..."
rm -rf build node_modules/.cache

# Remove node_modules
echo "Removing node_modules..."
rm -rf node_modules

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Install dependencies
echo "Installing dependencies..."
npm install

# Build the application
echo "Building the application..."
npm run build

echo "Build completed!" 