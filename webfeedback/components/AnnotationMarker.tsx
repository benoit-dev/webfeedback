'use client';

import { useEffect, useState, useCallback } from 'react';
import { MessageSquare } from 'lucide-react';
import type { AnnotationWithComments } from '../types';

interface AnnotationMarkerProps {
  annotation: AnnotationWithComments;
  onClick?: (annotation: AnnotationWithComments) => void;
}

export function AnnotationMarker({ annotation, onClick }: AnnotationMarkerProps) {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  const updatePosition = useCallback(() => {
    if (!element) return;

    try {
      const rect = element.getBoundingClientRect();

      // Position icon at top-right corner of element
      // getBoundingClientRect() returns viewport-relative coordinates, perfect for fixed positioning
      setPosition({
        top: rect.top - 8, // 8px above the element
        left: rect.right - 8, // 8px to the right of the element
      });
    } catch (err) {
      console.error('Failed to calculate position:', err);
    }
  }, [element]);

  useEffect(() => {
    // Reset element to force recalculation when annotation changes
    setElement(null);
    setPosition(null);

    let retryCount = 0;
    const maxRetries = 10; // Try for up to 1 second (10 * 100ms)

    const findAndPositionElement = () => {
      try {
        const el = document.querySelector(annotation.elementSelector) as HTMLElement;
        if (el) {
          setElement(el);
          // Small delay to ensure element is fully rendered
          setTimeout(() => {
            const rect = el.getBoundingClientRect();
            setPosition({
              top: rect.top - 8,
              left: rect.right - 8,
            });
          }, 0);
        } else if (retryCount < maxRetries) {
          // Retry if element not found (might still be loading)
          retryCount++;
          setTimeout(findAndPositionElement, 100);
        }
      } catch (err) {
        console.error('Failed to find element for annotation:', err);
      }
    };

    findAndPositionElement();
  }, [annotation.id, annotation.elementSelector]);

  useEffect(() => {
    if (!element) return;

    updatePosition();

    // Update position on scroll and resize
    const handleScroll = () => updatePosition();
    const handleResize = () => updatePosition();

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [element, updatePosition]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClick) {
      onClick(annotation);
    }
  };

  if (!element || !position) return null;

  return (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <button
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="pointer-events-auto flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white shadow-lg transition-all duration-200 hover:scale-110 active:scale-95 border-2 border-white"
        title={`${annotation.commentCount} comment${annotation.commentCount !== 1 ? 's' : ''} on this element`}
        aria-label={`View comments for annotation ${annotation.issueNumber}`}
      >
        <MessageSquare className="h-4 w-4" />
        {annotation.commentCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-semibold bg-red-500 text-white rounded-full border-2 border-white">
            {annotation.commentCount > 99 ? '99+' : annotation.commentCount}
          </span>
        )}
      </button>
    </div>
  );
}

