#!/bin/bash

# Exit on error
set -e

echo "Starting Render build process..."
echo "Current directory: $(pwd)"

# Install dependencies
echo "Installing dependencies..."
npm install

# Run the build
echo "Running build..."
npm run build

echo "Build process completed." 