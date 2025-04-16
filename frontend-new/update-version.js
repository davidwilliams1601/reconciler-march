// This script updates version.js with the current timestamp
const fs = require('fs');
const path = require('path');

const versionFilePath = path.join(__dirname, 'public', 'version.js');
const now = new Date();
const timestamp = now.getTime();
const isoDate = now.toISOString();

// Read the current version from package.json
const packageJson = require('./package.json');
const version = packageJson.version || '1.0.0';

const versionFileContent = `// This file is automatically updated during build to force cache invalidation
window.APP_VERSION = "${version}";
window.APP_BUILD_TIME = "${timestamp}";
window.APP_LAST_DEPLOY = "${isoDate}";

// This function checks if a new version is available
window.checkForUpdates = function() {
  fetch('/version.js?t=' + Date.now())
    .then(response => response.text())
    .then(newVersionContent => {
      const currentVersion = window.APP_BUILD_TIME;
      const matches = newVersionContent.match(/APP_BUILD_TIME = "(\\d+)"/);
      
      if (matches && matches[1] && matches[1] !== currentVersion) {
        console.log('New version available. Reloading...');
        window.location.reload(true);
      }
    })
    .catch(err => console.error('Failed to check for updates:', err));
};

// Check for updates every 5 minutes
setInterval(window.checkForUpdates, 300000);`;

fs.writeFileSync(versionFilePath, versionFileContent);
console.log(`Updated version.js with build time: ${timestamp}`); 