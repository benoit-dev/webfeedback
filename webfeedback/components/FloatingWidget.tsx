'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, FileText, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { getIssueComments } from '../lib/api';
import type { AnnotationWithComments, IssueWithMetadata } from '../types';
import { AllIssuesModal } from './AllIssuesModal';
import { IssueDetailDrawer } from './IssueDetailDrawer';
import { AnnotationMarkers } from './AnnotationMarkers';
import { AnnotationForm } from './AnnotationForm';
import { useAnnotations } from '../hooks/useAnnotations';
import { useElementSelection } from '../hooks/useElementSelection';
import { getAllMappings } from '../lib/storage';

interface FloatingWidgetProps {
  className?: string;
}

export function FloatingWidget({ className }: FloatingWidgetProps) {
  const [isAllIssuesModalOpen, setIsAllIssuesModalOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [selectedElementSelector, setSelectedElementSelector] = useState('');
  const [pageUrl, setPageUrl] = useState('');
  const [selectedIssueForDrawer, setSelectedIssueForDrawer] = useState<IssueWithMetadata | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showComments, setShowComments] = useState(true);
  const previousShowCommentsRef = useRef(true);
  const wasAnyOpenRef = useRef(false);

  // Helper function to normalize URL to pathname + search (without origin)
  // For the widget, we only need the relative path since it's embedded on the customer's site
  const normalizePageUrl = (): string => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    // Ensure we always return at least '/' for the root path
    const url = pathname + search;
    return url || '/';
  };

  useEffect(() => {
    // Get current page URL (normalized to pathname + search)
    setPageUrl(normalizePageUrl());
    
    // Listen for route changes
    const handleRouteChange = () => {
      setPageUrl(normalizePageUrl());
    };
    
    // Listen to popstate for browser back/forward
    window.addEventListener('popstate', handleRouteChange);
    
    // For Next.js App Router, observe pathname changes
    let lastPathname = window.location.pathname;
    const checkRouteChange = () => {
      const currentPathname = window.location.pathname;
      if (currentPathname !== lastPathname) {
        lastPathname = currentPathname;
        handleRouteChange();
      }
    };
    
    // Check for route changes periodically (Next.js App Router doesn't expose router events)
    const interval = setInterval(checkRouteChange, 100);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      clearInterval(interval);
    };
  }, []);

  const { annotations, loading, refresh } = useAnnotations(pageUrl);

  // Helper function to convert AnnotationWithComments to IssueWithMetadata
  const convertAnnotationToIssue = (annotation: AnnotationWithComments): IssueWithMetadata => {
    return {
      ...annotation.issue,
      parsedPageUrl: annotation.pageUrl,
      parsedElementSelector: annotation.elementSelector,
    };
  };

  // Handle deep linking (e.g., ?issue=123)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const issueNumber = urlParams.get('issue');
    
    if (!issueNumber) return;
    
    const issueNum = parseInt(issueNumber, 10);
    if (isNaN(issueNum)) return;
    
    // Try to find annotation in loaded annotations first
    let annotation = annotations.find((ann) => ann.issueNumber === issueNum);
    
    if (annotation) {
      handleIssueNavigation(annotation);
      return;
    }
    
    // If not found and still loading, wait for annotations to load
    if (loading) {
      return;
    }
    
    // If annotations are loaded but not found, try to find it in localStorage
    // and fetch the issue directly
    if (!loading) {
      const mappings = getAllMappings();
      const currentUrl = normalizePageUrl();
      
      // Try to find mapping for current page
      let mapping = mappings.find(
        (m) => m.issueNumber === issueNum && m.pageUrl === currentUrl
      );
      
      // If not found with exact URL, try to find any mapping with this issue number
      if (!mapping) {
        mapping = mappings.find((m) => m.issueNumber === issueNum);
      }
      
      if (mapping) {
        fetchIssueAndNavigate(issueNum, mapping);
      }
    }
  }, [annotations, loading, pageUrl]);

  const handleIssueNavigation = (annotation: AnnotationWithComments) => {
    // Refresh annotations to ensure we have the latest data
    refresh();
    
    // Convert annotation to issue and open drawer
    const issue = convertAnnotationToIssue(annotation);
    setSelectedIssueForDrawer(issue);
    setIsDrawerOpen(true);
    
    // Scroll to the element and highlight
    setTimeout(() => {
      try {
        const element = document.querySelector(annotation.elementSelector);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Highlight element briefly
          element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
          }, 3000);
        }
      } catch (err) {
        console.error('Failed to scroll to element:', err);
      }
    }, 500);
    
    // Clean up URL param after handling
    setTimeout(() => {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('issue');
      window.history.replaceState({}, '', newUrl.toString());
    }, 1000);
  };

  const fetchIssueAndNavigate = async (issueNumber: number, mapping: any) => {
    try {
      // Fetch comments via API
      const comments = await getIssueComments(issueNumber);
      
      // Try to find the full issue from annotations
      const existingAnnotation = annotations.find(
        (ann) => ann.issueNumber === issueNumber
      );
      
      if (existingAnnotation) {
        // Use the full issue data from the annotation
        const annotation: AnnotationWithComments = {
          ...existingAnnotation,
          comments,
          commentCount: comments.length,
        };
        handleIssueNavigation(annotation);
      } else {
        // We need to fetch the issue. Since we don't have a getIssue procedure,
        // we'll try to get it from getAllIssues or construct a minimal one
        // For now, create a minimal annotation - the issue data will be incomplete
        // but this is a fallback scenario
        const issue: IssueWithMetadata = {
          id: issueNumber,
          number: issueNumber,
          title: 'Issue', // Will be replaced if we have full issue data
          body: '',
          state: 'open',
          html_url: mapping.issueUrl,
          created_at: mapping.createdAt,
          labels: [],
          parsedPageUrl: mapping.pageUrl,
          parsedElementSelector: mapping.elementSelector,
        };
        
        const annotation: AnnotationWithComments = {
          id: `${mapping.elementSelector}_${mapping.pageUrl}`,
          elementSelector: mapping.elementSelector,
          pageUrl: mapping.pageUrl,
          issueNumber: mapping.issueNumber,
          issueUrl: mapping.issueUrl,
          createdAt: mapping.createdAt,
          issue: issue as any, // Type assertion needed due to minimal issue object
          comments,
          commentCount: comments.length,
        };
        
        handleIssueNavigation(annotation);
      }
    } catch (err) {
      console.error('Failed to fetch issue:', err);
    }
  };
  // Handle element selection
  useElementSelection(
    isSelecting,
    (result) => {
      setSelectedElementSelector(result.selector);
      setIsSelecting(false);
      setShowAnnotationForm(true);
    },
    () => {
      setIsSelecting(false);
    }
  );

  const handleWidgetClick = () => {
    if (isSelecting) {
      setIsSelecting(false);
    } else {
      setIsSelecting(true);
    }
  };

  const handleAnnotationSuccess = async () => {
    setShowAnnotationForm(false);
    setSelectedElementSelector('');
    
    // Force refetch after a short delay to allow GitHub API to index the new issue
    setTimeout(() => {
      refresh();
    }, 1000);
  };

  // Hide comments when drawer or modal opens, restore when closed
  useEffect(() => {
    const isAnyOpen = isDrawerOpen || isAllIssuesModalOpen;
    const wasOpen = wasAnyOpenRef.current;
    
    // Only act when the open state changes
    if (isAnyOpen && !wasOpen) {
      // Just opened: save current state and hide
      previousShowCommentsRef.current = showComments;
      setShowComments(false);
    } else if (!isAnyOpen && wasOpen) {
      // Just closed: restore previous state
      setShowComments(previousShowCommentsRef.current);
    }
    
    // Update ref for next render
    wasAnyOpenRef.current = isAnyOpen;
  }, [isDrawerOpen, isAllIssuesModalOpen, showComments]);

  return (
    <div data-webfeedback="root">
      <div
        className={`flex flex-col gap-3 ${className || ''}`}
        style={{ 
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          left: 'auto',
          top: 'auto',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
        data-webfeedback="widget"
      >
        {/* Actions Container */}
        <div 
          className="flex flex-row items-center bg-background rounded-lg p-1.5 shadow-lg border gap-2"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '8px',
            padding: '6px',
            borderRadius: '8px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
            border: '1px solid var(--border, #e5e7eb)',
            backgroundColor: 'var(--background, #ffffff)'
          }}
        >
          {/* Comment/Add Annotation Button */}
          <Button
            onClick={handleWidgetClick}
            size="icon"
            variant="ghost"
            className={`h-10 w-10 hover:bg-muted transition-all relative ${
              isSelecting ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
            }`}
            style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title={isSelecting ? 'Cancel selection' : 'Add annotation'}
          >
            <MessageSquare 
              className="h-4 w-4" 
              style={{
                width: '16px',
                height: '16px',
                display: 'block'
              }}
            />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSelecting ? 'white' : 'var(--primary, #000000)',
                padding: '2px',
                boxSizing: 'border-box'
              }}
            >
              <Plus 
                style={{
                  width: '8px',
                  height: '8px',
                  stroke: isSelecting ? '#3b82f6' : 'var(--primary-foreground, #ffffff)',
                  strokeWidth: '2.5',
                  fill: 'none',
                  display: 'block'
                }}
              />
            </span>
          </Button>

          {/* All Issues Button */}
          <Button
            onClick={() => setIsAllIssuesModalOpen(true)}
            size="icon"
            variant="ghost"
            className="h-10 w-10 hover:bg-muted transition-all"
            style={{
              width: '40px',
              height: '40px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="View all issues"
          >
            <FileText 
              className="h-4 w-4"
              style={{
                width: '16px',
                height: '16px',
                display: 'block'
              }}
            />
          </Button>

          {/* Show Comments Toggle */}
          <div 
            className="flex items-center gap-2 px-1"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              paddingLeft: '4px',
              paddingRight: '4px'
            }}
          >
            <div
              style={{
                display: 'inline-flex',
                height: '20px',
                width: '36px',
                flexShrink: 0,
                cursor: 'pointer',
                alignItems: 'center',
                borderRadius: '9999px',
                border: '2px solid transparent',
                transition: 'background-color 0.2s',
                backgroundColor: showComments 
                  ? 'var(--primary, #000000)' 
                  : 'var(--input, #e5e7eb)',
                position: 'relative'
              }}
              onClick={() => setShowComments(!showComments)}
            >
              <span
                style={{
                  pointerEvents: 'none',
                  display: 'block',
                  height: '16px',
                  width: '16px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--background, #ffffff)',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
                  transition: 'transform 0.2s',
                  transform: showComments ? 'translateX(16px)' : 'translateX(0)'
                }}
              />
            </div>
            <Label
              htmlFor="show-comments"
              className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap"
              style={{
                fontSize: '12px',
                cursor: 'pointer',
                color: 'var(--muted-foreground, #6b7280)',
                whiteSpace: 'nowrap',
                userSelect: 'none'
              }}
              onClick={() => setShowComments(!showComments)}
            >
              Show comments
            </Label>
          </div>
        </div>
      </div>

      {/* All Issues Modal */}
      <AllIssuesModal
        isOpen={isAllIssuesModalOpen}
        onClose={() => setIsAllIssuesModalOpen(false)}
      />

      {/* Annotation Form Dialog */}
      {showAnnotationForm && (
        <div 
          className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50"
          data-webfeedback="overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAnnotationForm(false);
              setSelectedElementSelector('');
            }
          }}
        >
          <div 
            className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
            data-webfeedback="dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <AnnotationForm
              pageUrl={pageUrl}
              initialElementSelector={selectedElementSelector}
              onCancel={() => {
                setShowAnnotationForm(false);
                setSelectedElementSelector('');
              }}
              onSuccess={handleAnnotationSuccess}
            />
          </div>
        </div>
      )}

      {showComments && (
        <AnnotationMarkers 
          annotations={annotations}
          onMarkerClick={(annotation) => {
            // Convert annotation to IssueWithMetadata and open drawer
            const issue = convertAnnotationToIssue(annotation);
            setSelectedIssueForDrawer(issue);
            setIsDrawerOpen(true);
            
            // Scroll to element and highlight
            setTimeout(() => {
              try {
                const element = document.querySelector(annotation.elementSelector);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
                  setTimeout(() => {
                    element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
                  }, 3000);
                }
              } catch (err) {
                console.error('Failed to scroll to element:', err);
              }
            }, 100);
          }}
        />
      )}

      {/* Issue Detail Drawer */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedIssueForDrawer(null);
        }}
        issue={selectedIssueForDrawer}
      />
    </div>
  );
}

