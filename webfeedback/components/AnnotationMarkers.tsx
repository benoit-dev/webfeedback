'use client';

import { AnnotationMarker } from './AnnotationMarker';
import type { AnnotationWithComments } from '../types';

interface AnnotationMarkersProps {
  annotations: AnnotationWithComments[];
  onMarkerClick?: (annotation: AnnotationWithComments) => void;
}

export function AnnotationMarkers({ annotations, onMarkerClick }: AnnotationMarkersProps) {
  return (
    <>
      {annotations.map((annotation) => (
        <AnnotationMarker 
          key={annotation.id} 
          annotation={annotation}
          onClick={onMarkerClick}
        />
      ))}
    </>
  );
}

