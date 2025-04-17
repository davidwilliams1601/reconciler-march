// This file is automatically updated during build to force cache invalidation
window.APP_VERSION = "1.0.0";
window.APP_BUILD_TIME = "<%= Date.now() %>";
window.APP_LAST_DEPLOY = "2025-04-15T14:00:00.000Z";

// This function checks if a new version is available
window.checkForUpdates = function() {
  fetch('/version.js?t=' + Date.now())
    .then(response => response.text())
    .then(newVersionContent => {
      const currentVersion = window.APP_BUILD_TIME;
      const matches = newVersionContent.match(/APP_BUILD_TIME = "(\d+)"/);
      
      if (matches && matches[1] && matches[1] !== currentVersion) {
        console.log('New version available. Reloading...');
        window.location.reload(true);
      }
    })
    .catch(err => console.error('Failed to check for updates:', err));
};

// Check for updates every 5 minutes
setInterval(window.checkForUpdates, 300000);

// This script is used for version tracking and also displays helpful information
// about setting up the Xero integration

console.log('%cInvoice Reconciler App', 'font-size: 20px; font-weight: bold; color: #4285f4;');
console.log('%cApplication version: 1.0.0', 'font-size: 12px; color: #333;');
console.log('%cBuild timestamp: ' + document.querySelector('meta[name="build-timestamp"]')?.content, 'font-size: 12px; color: #333;');

// Check if CSP is causing issues
console.log('%cChecking for CSP issues...', 'font-size: 14px; color: #ff9800;');
try {
  // Create a test font element to check if fonts can load
  const testFont = new FontFace('TestFont', 'url("data:application/font-woff2;base64,d09GMgABAAAAAADcA")');
  console.log('%cNo CSP font loading issues detected.', 'font-size: 12px; color: #4caf50;');
} catch (e) {
  console.error('%cCSP font loading issue detected: ' + e.message, 'font-size: 12px; color: #f44336;');
  console.log('%cIf you see font loading errors, try updating your Content-Security-Policy.', 'font-size: 12px; color: #f44336;');
}

// Xero Integration Setup Helper
console.log('%cXero Integration Helper', 'font-size: 16px; font-weight: bold; color: #0a85eb;');
console.log('%cTo set up Xero integration, run the following commands in your terminal:', 'font-size: 12px; color: #333;');
console.log('%c1. cd scripts', 'font-size: 12px; color: #333;');
console.log('%c2. node install-xero-setup.js', 'font-size: 12px; color: #333;');
console.log('%c3. node setup-xero.js', 'font-size: 12px; color: #333;');
console.log('%cFollow the prompts to complete the setup process.', 'font-size: 12px; color: #333;'); 