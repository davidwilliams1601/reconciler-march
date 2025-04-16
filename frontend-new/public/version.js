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