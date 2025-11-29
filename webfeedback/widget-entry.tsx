import React from 'react';
import { createRoot } from 'react-dom/client';
import { FloatingWidget, init } from './index';
import { initFromGlobalConfig } from './lib/config';

// Initialize widget - config should already be loaded by loader.js
function initializeWidget() {
  // Config should already be set by loader.js
  const config = (window as any).__WebFeedbackConfig;
  const apiKey = (window as any).__WebFeedbackApiKey;
  
  if (!config || !apiKey) {
    console.error('WebFeedback: Config not found. Make sure the loader script ran first.');
    return;
  }
  
  try {
    // Initialize widget with config
    initFromGlobalConfig();
    init({ apiEndpoint: config.apiEndpoint || '/api/webfeedback', apiKey });
    
    // Render widget
    const container = document.getElementById('webfeedback-widget-container') || 
      (() => {
        const div = document.createElement('div');
        div.id = 'webfeedback-widget-container';
        document.body.appendChild(div);
        return div;
      })();
    
    const root = createRoot(container);
    root.render(React.createElement(FloatingWidget));
  } catch (error) {
    console.error('WebFeedback: Failed to initialize widget', error);
  }
}

// Auto-initialize when config is ready
// The loader.js will load this script after fetching config
// So we can initialize immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeWidget);
} else {
  // Small delay to ensure config is set by loader
  setTimeout(initializeWidget, 0);
}

// Export for manual initialization if needed
(window as any).WebFeedback = {
  init: initializeWidget,
};

