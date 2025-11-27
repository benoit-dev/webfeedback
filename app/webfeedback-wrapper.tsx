'use client';

import { useEffect } from 'react';
import { FloatingWidget } from '@/webfeedback';
import { setupConfig, getConfigFromEnv } from '@/webfeedback';

export function WebFeedbackWidget() {
  useEffect(() => {
    try {
      // Try to get config from environment variables
      const config = getConfigFromEnv();
      setupConfig(config);
    } catch (error) {
      // If env vars are not set, widget won't work but won't crash
      console.warn('WebFeedback: GitHub configuration not found. Set environment variables or use setupConfig()');
    }
  }, []);

  return <FloatingWidget />;
}

