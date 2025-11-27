'use client';

import { CommentThread } from './CommentThread';
import type { AnnotationWithComments } from '../types';

interface AnnotationListProps {
  annotations: AnnotationWithComments[];
}

export function AnnotationList({ annotations }: AnnotationListProps) {
  return (
    <div className="space-y-4">
      {annotations.map((annotation) => (
        <CommentThread 
          key={annotation.id} 
          annotation={annotation}
        />
      ))}
    </div>
  );
}

