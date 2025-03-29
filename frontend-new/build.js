const { execSync } = require('child_process');
const path = require('path');

console.log('Starting build process...');
console.log('Current directory:', process.cwd());

try {
    // Install dependencies
    console.log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });

    // Run build
    console.log('Running build...');
    execSync('npm run build', { stdio: 'inherit' });

    console.log('Build process completed successfully.');
} catch (error) {
    console.error('Build failed:', error.message);
    process.exit(1);
} 