'use client';

import { useState, useEffect, useMemo } from 'react';
import { PageSection } from './PageSection';
import { getConfig } from '../lib/config';
import { getAllIssues, type IssueWithMetadata } from '../lib/github';
import { Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

interface IssuesListPageProps {
  configError?: string | null;
  onViewOnPage?: () => void;
  shouldRefetch?: boolean;
  filter?: 'open' | 'ready-for-review';
}

export function IssuesListPage({ configError, onViewOnPage, shouldRefetch, filter = 'open' }: IssuesListPageProps = {}) {
  const [issues, setIssues] = useState<IssueWithMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(configError || null);

  useEffect(() => {
    // If there's a config error from parent, show it immediately
    if (configError) {
      setError(configError);
      setLoading(false);
      return;
    }

    async function fetchIssues() {
      try {
        setLoading(true);
        setError(null);
        const config = getConfig();
        const allIssues = await getAllIssues(config);
        setIssues(allIssues);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Failed to fetch issues. Please try again.';
        
        // Check if it's a configuration error
        if (errorMessage.includes('not configured') || errorMessage.includes('Missing GitHub')) {
          setError(
            'GitHub configuration not found. Please set NEXT_PUBLIC_GITHUB_TOKEN, NEXT_PUBLIC_GITHUB_OWNER, and NEXT_PUBLIC_GITHUB_REPO in your .env.local file.'
          );
        } else {
          setError(errorMessage);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchIssues();
  }, [configError, shouldRefetch]);

  // Filter issues based on the active tab
  const filteredIssues = useMemo(() => {
    if (filter === 'ready-for-review') {
      return issues.filter((issue) => 
        issue.labels.some(
          (label) => label.name.toLowerCase() === 'ready for review'
        )
      );
    }
    // 'open' tab shows all open issues (no additional filtering needed)
    return issues;
  }, [issues, filter]);

  // Group issues by page URL
  const issuesByPage = filteredIssues.reduce((acc, issue) => {
    const pageUrl = issue.parsedPageUrl || 'Unknown Page';
    if (!acc[pageUrl]) {
      acc[pageUrl] = [];
    }
    acc[pageUrl].push(issue);
    return acc;
  }, {} as Record<string, IssueWithMetadata[]>);

  // Sort issues within each page by creation date (newest first)
  Object.keys(issuesByPage).forEach((pageUrl) => {
    issuesByPage[pageUrl].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  // Sort pages by total issues (most issues first)
  const sortedPages = Object.entries(issuesByPage).sort(
    ([, a], [, b]) => b.length - a.length
  );

  // Helper function to get base path from URL
  const getBasePath = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname || '/';
    } catch {
      // If URL parsing fails, try to extract pathname manually
      const match = url.match(/\/\/[^\/]+(\/.*?)(?:\?|$)/);
      return match ? match[1] : url;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground">Loading issues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (filteredIssues.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">
              {filter === 'ready-for-review' 
                ? 'No issues ready for review' 
                : 'No issues found'}
            </p>
            <p className="text-sm">
              {filter === 'ready-for-review'
                ? 'Issues with the "ready for review" label will appear here.'
                : 'Create your first annotation by clicking the widget button on any page.'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <p className="text-sm text-muted-foreground">
          {filteredIssues.length} {filteredIssues.length === 1 ? 'issue' : 'issues'} across{' '}
          {sortedPages.length} {sortedPages.length === 1 ? 'page' : 'pages'}
        </p>
      </div>

      <Accordion type="multiple" className="w-full" defaultValue={[sortedPages[0]?.[0] || '']}>
        {sortedPages.map(([pageUrl, pageIssues]) => {
          const basePath = getBasePath(pageUrl);
          return (
            <AccordionItem key={pageUrl} value={pageUrl}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{basePath}</span>
                  <span className="text-sm text-muted-foreground">
                    ({pageIssues.length} {pageIssues.length === 1 ? 'issue' : 'issues'})
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <PageSection pageUrl={pageUrl} issues={pageIssues} onViewOnPage={onViewOnPage} />
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
