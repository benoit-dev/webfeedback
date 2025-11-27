'use client';

import { useEffect, useCallback } from 'react';

export interface ElementSelectionResult {
  element: HTMLElement;
  selector: string;
}

export function useElementSelection(
  isActive: boolean,
  onSelect: (result: ElementSelectionResult) => void,
  onCancel?: () => void
) {
  useEffect(() => {
    if (!isActive) return;

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body && !target.closest('[data-webfeedback]')) {
        target.style.outline = '2px solid #3b82f6';
        target.style.outlineOffset = '2px';
        target.style.cursor = 'pointer';
      }
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target !== document.body) {
        target.style.outline = '';
        target.style.outlineOffset = '';
        target.style.cursor = '';
      }
    };

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const target = e.target as HTMLElement;
      
      // Don't select webfeedback elements
      if (target && target !== document.body && !target.closest('[data-webfeedback]')) {
        const selector = generateSelector(target);
        onSelect({ element: target, selector });
        
        // Clean up outlines
        document.querySelectorAll('*').forEach((el) => {
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.outlineOffset = '';
          (el as HTMLElement).style.cursor = '';
        });
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onCancel) {
        onCancel();
        // Clean up outlines
        document.querySelectorAll('*').forEach((el) => {
          (el as HTMLElement).style.outline = '';
          (el as HTMLElement).style.outlineOffset = '';
          (el as HTMLElement).style.cursor = '';
        });
      }
    };

    // Add overlay to prevent interaction with page
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 9998;
      background: rgba(0, 0, 0, 0.02);
      pointer-events: none;
    `;
    overlay.setAttribute('data-webfeedback', 'overlay');
    document.body.appendChild(overlay);

    // Add instruction banner
    const banner = document.createElement('div');
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      background: #3b82f6;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      font-size: 14px;
      font-weight: 500;
      pointer-events: none;
    `;
    banner.textContent = 'Click on an element to annotate it • Press ESC to cancel';
    banner.setAttribute('data-webfeedback', 'banner');
    document.body.appendChild(banner);

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);
    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleEscape);
      
      // Clean up outlines
      document.querySelectorAll('*').forEach((el) => {
        (el as HTMLElement).style.outline = '';
        (el as HTMLElement).style.outlineOffset = '';
        (el as HTMLElement).style.cursor = '';
      });
      
      // Remove overlay and banner
      overlay.remove();
      banner.remove();
    };
  }, [isActive, onSelect, onCancel]);
}

function generateSelector(element: HTMLElement): string {
  // Try ID first
  if (element.id) {
    return `#${element.id}`;
  }

  // Try data attributes
  if (element.hasAttribute('data-testid')) {
    return `[data-testid="${element.getAttribute('data-testid')}"]`;
  }

  // Try class names
  if (element.className && typeof element.className === 'string') {
    const classes = element.className
      .split(' ')
      .filter((c) => c && !c.startsWith('webfeedback'))
      .slice(0, 3)
      .join('.');
    if (classes) {
      return `.${classes}`;
    }
  }

  // Fallback to tag name with nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    return `${element.tagName.toLowerCase()}:nth-child(${index})`;
  }

  return element.tagName.toLowerCase();
}

