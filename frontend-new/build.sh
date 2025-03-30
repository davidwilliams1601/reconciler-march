#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."
echo "Current directory: $(pwd)"

# Find npm location
NPM_PATH=$(which npm)
echo "NPM location: $NPM_PATH"

# Check if npm exists
if [ -z "$NPM_PATH" ]; then
    echo "Error: npm not found in PATH"
    echo "PATH: $PATH"
    exit 1
fi

echo "Node version: $(node --version)"
echo "NPM version: $($NPM_PATH --version)"

echo "Installing dependencies..."
$NPM_PATH install

echo "Running build..."
$NPM_PATH run build

echo "Build process completed." 