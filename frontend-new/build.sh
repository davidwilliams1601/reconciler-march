#!/bin/bash

# Exit on error
set -e

echo "Starting build process..."
echo "Current directory: $(pwd)"

# Create Node.js build script
cat > build.js << 'EOL'
const { execSync } = require('child_process');

console.log('Starting Node.js build process...');

try {
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    console.log('Running build...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('Build process completed successfully.');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
}
EOL

# Run the Node.js build script
echo "Running Node.js build script..."
node build.js

echo "Build process completed." 