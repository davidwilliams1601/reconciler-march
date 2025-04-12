#!/bin/bash

# Exit on error
set -e

echo "Installing dependencies for Xero and Google Vision integration..."

# Navigate to backend directory
cd backend

# Install dependencies
npm install @google-cloud/vision@4.0.2 \
  axios@1.6.0 \
  fs-extra@11.2.0 \
  node-fetch@2.7.0 \
  path@0.12.7

# Optional: Install dev dependencies
npm install --save-dev jest@29.7.0 supertest@6.3.3

echo "Dependencies installed successfully."
echo "Note: For Google Vision to work, you will need to:"
echo "1. Set up credentials in the Settings page, or"
echo "2. Create a service account key file and update the settings with its path"

# Return to original directory
cd .. 