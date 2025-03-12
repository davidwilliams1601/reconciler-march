#!/bin/bash

# Exit on error
set -e

# Print debugging information
echo "=== Build Environment Information ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "Parent directory contents:"
ls -la ..
echo "Environment variables:"
env
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "=================================="

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

# Verify installation
echo "Verifying node_modules..."
ls -la node_modules
echo "Package.json contents:"
cat package.json

# Build the application
echo "Building the application..."
npm run build

# Verify build output
echo "Verifying build output..."
ls -la build

echo "Build completed!" 