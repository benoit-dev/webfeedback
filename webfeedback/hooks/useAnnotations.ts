'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { getMappingsForPage } from '../lib/storage';
import { getAnnotationsWithComments } from '../lib/api';
import type { AnnotationWithComments } from '../types';

export function useAnnotations(pageUrl: string) {
  const [annotations, setAnnotations] = useState<AnnotationWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get mappings from localStorage (client-side)
  const mappings = useMemo(() => getMappingsForPage(pageUrl), [pageUrl]);

  const fetchAnnotations = useCallback(async () => {
    // Don't fetch if pageUrl is empty or invalid
    if (!pageUrl || pageUrl.trim() === '') {
      setAnnotations([]);
      setLoading(false);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await getAnnotationsWithComments(pageUrl, mappings);
      setAnnotations(data);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch annotations');
      setError(error);
      setAnnotations([]);
    } finally {
      setLoading(false);
    }
  }, [pageUrl, mappings]);

  useEffect(() => {
    fetchAnnotations();

    // Refresh every 30 seconds
    const interval = setInterval(fetchAnnotations, 30000);
    return () => clearInterval(interval);
  }, [fetchAnnotations]);

  const refresh = useCallback(async () => {
    await fetchAnnotations();
  }, [fetchAnnotations]);

  return { 
    annotations, 
    loading, 
    error, 
    refresh 
  };
}

