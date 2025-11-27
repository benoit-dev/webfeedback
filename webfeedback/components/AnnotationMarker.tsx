'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { MessageSquare } from 'lucide-react';
import type { AnnotationWithComments } from '../types';

interface AnnotationMarkerProps {
  annotation: AnnotationWithComments;
}

export function AnnotationMarker({ annotation }: AnnotationMarkerProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    try {
      const el = document.querySelector(annotation.elementSelector) as HTMLElement;
      if (el) {
        setElement(el);
        
        // Make element position relative if not already
        const computedStyle = window.getComputedStyle(el);
        if (computedStyle.position === 'static') {
          el.style.position = 'relative';
        }

        // Add hover effect
        const handleMouseEnter = () => setShowBadge(true);
        const handleMouseLeave = () => setShowBadge(false);
        
        el.addEventListener('mouseenter', handleMouseEnter);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          el.removeEventListener('mouseenter', handleMouseEnter);
          el.removeEventListener('mouseleave', handleMouseLeave);
        };
      }
    } catch (err) {
      console.error('Failed to find element for annotation:', err);
    }
  }, [annotation.elementSelector]);

  if (!element) return null;

  return (
    <div
      className="absolute -top-2 -right-2 z-50 pointer-events-none"
      style={{
        position: 'absolute',
        top: '-8px',
        right: '-8px',
      }}
    >
      <Badge
        variant="default"
        className={`flex items-center gap-1 transition-opacity ${
          showBadge ? 'opacity-100' : 'opacity-70'
        }`}
        style={{ pointerEvents: 'auto' }}
      >
        <MessageSquare className="h-3 w-3" />
        {annotation.commentCount > 0 && (
          <span className="text-xs">{annotation.commentCount}</span>
        )}
      </Badge>
    </div>
  );
}

