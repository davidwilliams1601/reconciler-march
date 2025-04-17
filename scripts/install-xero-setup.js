#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Installing dependencies for Xero setup...');

// Define required packages
const requiredPackages = [
  'express',
  'axios',
  'dotenv',
  'open',
  'mongoose'
];

// Check if package.json exists in scripts directory
const packageJsonPath = path.join(__dirname, 'package.json');
let packageJson = {};

if (fs.existsSync(packageJsonPath)) {
  try {
    packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    console.error('Error reading package.json:', error);
    packageJson = {};
  }
} else {
  // Create a new package.json
  packageJson = {
    name: 'xero-setup',
    version: '1.0.0',
    description: 'Xero setup utility',
    main: 'setup-xero.js',
    scripts: {
      start: 'node setup-xero.js'
    },
    dependencies: {}
  };
}

// Add script to package.json if not already there
if (!packageJson.scripts) {
  packageJson.scripts = {};
}

packageJson.scripts.setup = 'node setup-xero.js';

// Save the updated package.json
fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

// Install dependencies
try {
  console.log('Installing dependencies...');
  execSync(`npm install ${requiredPackages.join(' ')} --save`, {
    cwd: __dirname,
    stdio: 'inherit'
  });
  console.log('\nDependencies installed successfully!');
  console.log('\nTo run the Xero setup utility, execute:');
  console.log('\n  cd scripts');
  console.log('  node setup-xero.js');
} catch (error) {
  console.error('\nError installing dependencies:', error.message);
  console.log('\nPlease try installing them manually:');
  console.log(`\n  npm install ${requiredPackages.join(' ')} --save`);
} 