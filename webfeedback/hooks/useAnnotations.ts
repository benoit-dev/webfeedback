'use client';

import { useState, useEffect } from 'react';
import type { AnnotationWithComments } from '../types';
import { getConfig } from '../lib/config';
import { getAnnotationsWithComments } from '../lib/github';

export function useAnnotations(pageUrl: string) {
  const [annotations, setAnnotations] = useState<AnnotationWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchAnnotations() {
      try {
        setLoading(true);
        const config = getConfig();
        const data = await getAnnotationsWithComments(config, pageUrl);
        setAnnotations(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch annotations'));
        setAnnotations([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAnnotations();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnnotations, 30000);
    return () => clearInterval(interval);
  }, [pageUrl]);

  const refresh = async () => {
    try {
      setLoading(true);
      const config = getConfig();
      const data = await getAnnotationsWithComments(config, pageUrl);
      setAnnotations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to refresh annotations'));
    } finally {
      setLoading(false);
    }
  };

  return { annotations, loading, error, refresh };
}

