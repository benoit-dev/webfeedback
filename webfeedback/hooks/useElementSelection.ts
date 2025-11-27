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
        let verifiedSelector = selector;
        
        try {
          // Verify the selector matches the exact element
          const matchedElements = document.querySelectorAll(selector);
          
          if (matchedElements.length > 1) {
            // If multiple elements match, find the index of our target
            const index = Array.from(matchedElements).indexOf(target);
            if (index !== -1 && index > 0) {
              // Add a more specific selector with the exact index
              // Try to add a unique attribute or use a more specific path
              verifiedSelector = generateUniqueSelector(target, selector, index);
            }
          }
          
          // Final verification: ensure the selector matches our target
          try {
            const finalMatch = document.querySelector(verifiedSelector);
            if (finalMatch === target) {
              onSelect({ element: target, selector: verifiedSelector });
            } else {
              // Fallback: use a data attribute approach
              const fallbackSelector = generateFallbackSelector(target);
              onSelect({ element: target, selector: fallbackSelector });
            }
          } catch (queryError) {
            // If selector is invalid, use fallback
            console.warn('Invalid selector, using fallback:', verifiedSelector, queryError);
            const fallbackSelector = generateFallbackSelector(target);
            onSelect({ element: target, selector: fallbackSelector });
          }
        } catch (selectorError) {
          // If selector generation failed, use fallback
          console.warn('Selector generation failed, using fallback:', selectorError);
          const fallbackSelector = generateFallbackSelector(target);
          onSelect({ element: target, selector: fallbackSelector });
        }
        
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

// Escape CSS class names to handle special characters
function escapeClassName(className: string): string {
  // CSS class names need to escape special characters
  // Characters that need escaping: @, /, :, [, ], {, }, (, ), etc.
  return className.replace(/([@/:\[\]{}()])/g, '\\$1');
}

function generateSelector(element: HTMLElement): string {
  // Try ID first - this is always unique
  if (element.id) {
    return `#${element.id}`;
  }

  // Try data attributes that are likely unique
  const dataAttrs = ['data-testid', 'data-id', 'data-key', 'data-name'];
  for (const attr of dataAttrs) {
    if (element.hasAttribute(attr)) {
      const value = element.getAttribute(attr);
      if (value) {
        return `[${attr}="${value}"]`;
      }
    }
  }

  // Build a unique path by traversing up the DOM tree
  const path: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;
  const maxDepth = 8; // Limit depth to avoid overly long selectors

  while (current && current !== document.body && depth < maxDepth) {
    let selector = current.tagName.toLowerCase();

    // Add ID if available (most specific)
    if (current.id) {
      selector = `#${current.id}`;
      path.unshift(selector);
      break; // ID is unique, we can stop here
    }

    // Add nth-of-type to make it specific
    const parent = current.parentElement;
    if (parent) {
      const siblings = Array.from(parent.children).filter(
        (el) => el.tagName === current!.tagName
      );
      const index = siblings.indexOf(current) + 1;
      
      if (siblings.length > 1) {
        selector += `:nth-of-type(${index})`;
      }

      // Add classes if they exist and help make it unique
      if (current.className && typeof current.className === 'string') {
        const classes = current.className
          .split(' ')
          .filter((c) => c && !c.startsWith('webfeedback') && c.trim())
          .slice(0, 2) // Use fewer classes but combine with nth-of-type
          .map(escapeClassName); // Escape special characters
        
        if (classes.length > 0) {
          selector = `${selector}.${classes.join('.')}`;
        }
      }
    }

    path.unshift(selector);
    current = parent;
    depth++;
  }

  // If we have a path, return it
  if (path.length > 0) {
    return path.join(' > ');
  }

  // Final fallback - just the tag with nth-child
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children);
    const index = siblings.indexOf(element) + 1;
    return `${element.tagName.toLowerCase()}:nth-child(${index})`;
  }

  return element.tagName.toLowerCase();
}

function generateUniqueSelector(
  element: HTMLElement,
  baseSelector: string,
  index: number
): string {
  // Try to build a more specific path by including parent context
  const path: string[] = [];
  let current: HTMLElement | null = element;
  let depth = 0;
  const maxDepth = 6;

  while (current && current !== document.body && depth < maxDepth) {
    const parent = current.parentElement;
    if (!parent) break;

    let selector = current.tagName.toLowerCase();

    // Add nth-of-type for specificity
    const siblings = Array.from(parent.children).filter(
      (el) => el.tagName === current!.tagName
    );
    const siblingIndex = siblings.indexOf(current) + 1;
    
    if (siblings.length > 1) {
      selector += `:nth-of-type(${siblingIndex})`;
    }

    // Add classes
    if (current.className && typeof current.className === 'string') {
      const classes = current.className
        .split(' ')
        .filter((c) => c && !c.startsWith('webfeedback') && c.trim())
        .slice(0, 1)
        .map(escapeClassName); // Escape special characters
      
      if (classes.length > 0) {
        selector = `${selector}.${classes.join('.')}`;
      }
    }

    path.unshift(selector);
    current = parent;
    depth++;

    // If we've built enough context, check if it's unique
    if (depth >= 3) {
      const testSelector = path.join(' > ');
      try {
        const matches = document.querySelectorAll(testSelector);
        if (matches.length === 1 && matches[0] === element) {
          return testSelector;
        }
      } catch (error) {
        // If selector is invalid, continue building path
        console.warn('Invalid test selector:', testSelector, error);
      }
    }
  }

  // If path building didn't work, use the base selector with parent context
  const parent = element.parentElement;
  if (parent) {
    try {
      const parentSelector = generateSelector(parent);
      if (parentSelector && parentSelector !== baseSelector) {
        return `${parentSelector} > ${baseSelector}`;
      }
    } catch (error) {
      console.warn('Failed to generate parent selector:', error);
    }
  }

  return baseSelector;
}

function generateFallbackSelector(element: HTMLElement): string {
  // Create a unique selector by adding a temporary data attribute
  // This is a last resort but ensures we can always find the element
  const uniqueId = `webfeedback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  element.setAttribute('data-webfeedback-id', uniqueId);
  return `[data-webfeedback-id="${uniqueId}"]`;
}

