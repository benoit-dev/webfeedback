'use client';

import { useEffect } from 'react';
import { FloatingWidget, init } from '@/webfeedback';

export function WebFeedbackWidget() {
  useEffect(() => {
    // Get API key from environment variable or use undefined (will fail gracefully)
    const apiKey = process.env.NEXT_PUBLIC_WEBFEEDBACK_API_KEY;
    
    // Initialize with API endpoint and key
    init({ 
      apiEndpoint: '/api/webfeedback',
      apiKey: apiKey,
    });
  }, []);

  return <FloatingWidget />;
}

