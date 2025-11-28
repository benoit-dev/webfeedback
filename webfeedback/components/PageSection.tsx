'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { IssueCard } from './IssueCard';
import type { IssueWithMetadata } from '../types';
import { Globe } from 'lucide-react';

interface PageSectionProps {
  pageUrl: string;
  issues: IssueWithMetadata[];
  onViewOnPage?: () => void;
  onOpenDrawer?: (issue: IssueWithMetadata) => void;
}

export function PageSection({ pageUrl, issues, onViewOnPage, onOpenDrawer }: PageSectionProps) {
  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <IssueCard 
          key={issue.id} 
          issue={issue} 
          onViewOnPage={onViewOnPage}
          onOpenDrawer={onOpenDrawer}
        />
      ))}
    </div>
  );
}

