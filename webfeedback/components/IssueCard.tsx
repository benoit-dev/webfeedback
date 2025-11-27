'use client';

import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { IssueWithMetadata } from '../lib/github';

interface IssueCardProps {
  issue: IssueWithMetadata;
  onViewOnPage?: () => void;
  onOpenDrawer?: (issue: IssueWithMetadata) => void;
}

export function IssueCard({ issue, onViewOnPage, onOpenDrawer }: IssueCardProps) {
  const handleClick = () => {
    console.log('IssueCard clicked:', { issueNumber: issue.number, hasDrawerHandler: !!onOpenDrawer });
    if (onOpenDrawer) {
      console.log('Opening drawer for issue:', issue.number);
      onOpenDrawer(issue);
    } else if (issue.parsedPageUrl) {
      // Fallback to navigation if no drawer handler
      console.log('No drawer handler, navigating to page');
      const targetUrl = new URL(issue.parsedPageUrl);
      targetUrl.searchParams.set('issue', issue.number.toString());
      
      if (onViewOnPage) {
        onViewOnPage();
      }
      
      window.location.href = targetUrl.toString();
    }
  };

  const handleViewOnPage = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (issue.parsedPageUrl) {
      const targetUrl = new URL(issue.parsedPageUrl);
      targetUrl.searchParams.set('issue', issue.number.toString());
      
      if (onViewOnPage) {
        onViewOnPage();
      }
      
      window.location.href = targetUrl.toString();
    }
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <CardTitle className="text-base font-medium flex-1">
            {issue.title}
          </CardTitle>
          <div className="flex gap-2">
            {issue.parsedPageUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleViewOnPage}
              >
                View on Page
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

