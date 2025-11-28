'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageSquare, FileText, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import type { AnnotationWithComments } from '../types';
import type { IssueWithMetadata } from '../lib/github';
import { AllIssuesModal } from './AllIssuesModal';
import { IssueDetailDrawer } from './IssueDetailDrawer';
import { AnnotationMarkers } from './AnnotationMarkers';
import { AnnotationForm } from './AnnotationForm';
import { useAnnotations } from '../hooks/useAnnotations';
import { useElementSelection } from '../hooks/useElementSelection';
import { getAllMappings } from '../lib/storage';
import { getConfig } from '../lib/config';
import { getGitHubIssueComments } from '../lib/github';

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
  const normalizePageUrl = (): string => {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const normalizedPath = pathname + search;
    
    // Prepend NEXT_PUBLIC_URL if available
    const baseUrl = process.env.NEXT_PUBLIC_URL;
    if (baseUrl) {
      // Ensure baseUrl doesn't end with / and path starts with /
      const cleanBaseUrl = baseUrl.replace(/\/$/, '');
      const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
      return `${cleanBaseUrl}${cleanPath}`;
    }
    
    return normalizedPath;
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
      const config = getConfig();
      
      // Fetch issue and comments
      const response = await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${issueNumber}`,
        {
          headers: {
            'Authorization': `token ${config.token}`,
            'Accept': 'application/vnd.github.v3+json',
          },
        }
      );
      
      if (response.ok) {
        const issue = await response.json();
        const comments = await getGitHubIssueComments(config, issueNumber);
        
        const annotation: AnnotationWithComments = {
          id: `${mapping.elementSelector}_${mapping.pageUrl}`,
          elementSelector: mapping.elementSelector,
          pageUrl: mapping.pageUrl,
          issueNumber: mapping.issueNumber,
          issueUrl: mapping.issueUrl,
          createdAt: mapping.createdAt,
          issue,
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
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col gap-3 ${className || ''}`}
        style={{ position: 'fixed' }}
        data-webfeedback="widget"
      >
        {/* Actions Container */}
        <div className="flex flex-row items-center bg-background rounded-lg p-1.5 shadow-lg border gap-2">
          {/* Comment/Add Annotation Button */}
          <Button
            onClick={handleWidgetClick}
            size="icon"
            variant="ghost"
            className={`h-10 w-10 hover:bg-muted transition-all relative ${
              isSelecting ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''
            }`}
            title={isSelecting ? 'Cancel selection' : 'Add annotation'}
          >
            <MessageSquare className="h-4 w-4" />
            <Plus className={`h-2.5 w-2.5 absolute -top-0.5 -right-0.5 rounded-full p-0.5 stroke-[3] ${
              isSelecting ? 'bg-white text-blue-500' : 'bg-primary text-primary-foreground'
            }`} />
          </Button>

          {/* All Issues Button */}
          <Button
            onClick={() => setIsAllIssuesModalOpen(true)}
            size="icon"
            variant="ghost"
            className="h-10 w-10 hover:bg-muted transition-all"
            title="View all issues"
          >
            <FileText className="h-4 w-4" />
          </Button>

          {/* Show Comments Toggle */}
          <div className="flex items-center gap-2 px-1">
            <Switch
              id="show-comments"
              checked={showComments}
              onCheckedChange={setShowComments}
            />
            <Label
              htmlFor="show-comments"
              className="text-xs cursor-pointer text-muted-foreground whitespace-nowrap"
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAnnotationForm(false);
              setSelectedElementSelector('');
            }
          }}
        >
          <div 
            className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl"
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
    </>
  );
}

