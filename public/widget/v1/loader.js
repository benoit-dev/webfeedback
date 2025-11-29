(function() {
  'use strict';
  
  // Extract base URL from where the script was loaded (webfeedback server)
  function getBaseUrl() {
    var currentScript = document.currentScript || 
      (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
    
    if (currentScript) {
      var src = currentScript.src || currentScript.getAttribute('src') || '';
      if (src) {
        try {
          var url = new URL(src);
          // Extract origin from script URL (this is the webfeedback server)
          return url.origin;
        } catch (e) {
          // If URL parsing fails, try to extract origin manually
          var match = src.match(/^(https?:\/\/[^\/]+)/);
          if (match) {
            return match[1];
          }
        }
      }
    }
    
    // Fallback to current origin (for same-domain embedding)
    return window.location.origin;
  }
  
  // Extract API key from script tag or URL
  function getApiKey() {
    var currentScript = document.currentScript || 
      (function() {
        var scripts = document.getElementsByTagName('script');
        return scripts[scripts.length - 1];
      })();
    
    if (currentScript) {
      var src = currentScript.src || currentScript.getAttribute('src') || '';
      var match = src.match(/[?&]key=([^&]+)/);
      if (match) {
        return decodeURIComponent(match[1]);
      }
      
      // Try data attribute
      var dataKey = currentScript.getAttribute('data-key');
      if (dataKey) {
        return dataKey;
      }
    }
    
    // Fall back to URL search params
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('key');
  }
  
  // Initialize widget with API key
  async function initializeWidget() {
    var apiKey = getApiKey();
    
    if (!apiKey) {
      console.error('WebFeedback: API key not found. Please provide a key in the script URL: ?key=wf_...');
      return;
    }
    
    // Get base URL from where script was loaded (webfeedback server)
    var baseUrl = getBaseUrl();
    
    // Fetch config from server
    try {
      var configResponse = await fetch(baseUrl + '/api/widget/config?key=' + encodeURIComponent(apiKey));
      
      if (!configResponse.ok) {
        var errorText = await configResponse.text();
        throw new Error('Failed to load widget config: ' + configResponse.statusText + ' - ' + errorText);
      }
      
      var config = await configResponse.json();
      
      // Load widget CSS
      var link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = baseUrl + '/widget/v1/webfeedback.css';
      document.head.appendChild(link);
      
      // Store config globally for widget to use (before loading bundle)
      window.__WebFeedbackConfig = config;
      window.__WebFeedbackApiKey = apiKey;
      
      // Load widget bundle (IIFE format, not module)
      var widgetScript = document.createElement('script');
      // Add cache busting timestamp to force fresh fetch
      var timestamp = Date.now();
      widgetScript.src = baseUrl + '/api/widget/webfeedback.js?key=' + encodeURIComponent(apiKey) + '&t=' + timestamp;
      widgetScript.type = 'text/javascript'; // Explicitly set type to prevent module loading
      widgetScript.onerror = function() {
        console.error('WebFeedback: Failed to load widget bundle');
      };
      widgetScript.onload = function() {
        // Bundle validation is done at build time and API route level
        // The IIFE executes synchronously when the script loads
        // Note: The bundle sets window.WebFeedback internally, but we don't need to verify it here
        // since validation happens at build time. If there's an issue, it will show up as a runtime error.
      };
      document.head.appendChild(widgetScript);
    } catch (error) {
      console.error('WebFeedback: Failed to initialize widget', error);
    }
  }
  
  // Auto-initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeWidget);
  } else {
    initializeWidget();
  }
  
  // Export for manual initialization
  window.WebFeedback = window.WebFeedback || {};
  window.WebFeedback.init = initializeWidget;
})();

