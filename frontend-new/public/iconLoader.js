// Custom Icon Loader - handles null values and CSP issues gracefully
(function() {
  // Safe access function for handling null/undefined values
  function safeAccess(obj, path) {
    if (!obj) return undefined;
    if (!path) return obj;
    
    const parts = path.split('.');
    let current = obj;
    
    for (let i = 0; i < parts.length; i++) {
      if (current === null || current === undefined) return undefined;
      current = current[parts[i]];
    }
    
    return current;
  }

  // Helper to safely convert SVG icon content
  function processSvgContent(svgContent) {
    if (!svgContent || typeof svgContent !== 'string') return '';
    return svgContent
      .replace(/[\u00A0-\u9999<>&]/g, function(i) {
        return '&#' + i.charCodeAt(0) + ';';
      });
  }

  // Initialize the icon loader
  function initIconLoader() {
    console.log('Initializing safe icon loader...');
    
    // Find all elements that need icons
    const iconElements = document.querySelectorAll('[data-mui-icon]');
    if (!iconElements || iconElements.length === 0) {
      console.log('No Material-UI icon elements found on page');
      return;
    }
    
    console.log(`Found ${iconElements.length} icon elements to process`);
    
    // Process each icon element
    iconElements.forEach(function(element) {
      try {
        const iconName = element.getAttribute('data-mui-icon');
        if (!iconName) {
          console.warn('Element has data-mui-icon attribute but no icon name');
          return;
        }
        
        // Create the icon element
        const svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgElement.setAttribute('focusable', 'false');
        svgElement.setAttribute('aria-hidden', 'true');
        svgElement.setAttribute('viewBox', '0 0 24 24');
        
        // Set the path
        const pathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Common icon paths - add more as needed
        const iconPaths = {
          'check': 'M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z',
          'error': 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z',
          'sync': 'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z',
          'accountBalance': 'M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zm-4.5-9L2 6v2h19V6l-9.5-5z',
          'receipt': 'M18 17H6v-2h12v2zm0-4H6v-2h12v2zm0-4H6V7h12v2zM3 22l1.5-1.5L6 22l1.5-1.5L9 22l1.5-1.5L12 22l1.5-1.5L15 22l1.5-1.5L18 22l1.5-1.5L21 22V2l-1.5 1.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2 4.5 3.5 3 2v20z',
          'schedule': 'M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z',
          'cloudDownload': 'M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z',
          'verifiedUser': 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'
        };
        
        const path = iconPaths[iconName] || '';
        if (path) {
          pathElement.setAttribute('d', path);
          svgElement.appendChild(pathElement);
          
          // Clear the element and append the SVG
          element.innerHTML = '';
          element.appendChild(svgElement);
        } else {
          console.warn(`Icon path not found for "${iconName}"`);
        }
      } catch (err) {
        console.error('Error processing icon:', err);
      }
    });
  }

  // Wait for document to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initIconLoader);
  } else {
    initIconLoader();
  }
})(); 