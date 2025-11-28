'use client';

import { useEffect } from 'react';
import { FloatingWidget, init } from 'webfeedback';

export function WebFeedbackWidget() {
  useEffect(() => {
    // Initialize with your API endpoint
    init({ apiEndpoint: '/api/webfeedback' });
  }, []);

  return <FloatingWidget />;
}

