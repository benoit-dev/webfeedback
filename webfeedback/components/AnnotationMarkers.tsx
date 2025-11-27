'use client';

import { AnnotationMarker } from './AnnotationMarker';
import type { AnnotationWithComments } from '../types';

interface AnnotationMarkersProps {
  annotations: AnnotationWithComments[];
}

export function AnnotationMarkers({ annotations }: AnnotationMarkersProps) {
  return (
    <>
      {annotations.map((annotation) => (
        <AnnotationMarker key={annotation.id} annotation={annotation} />
      ))}
    </>
  );
}

