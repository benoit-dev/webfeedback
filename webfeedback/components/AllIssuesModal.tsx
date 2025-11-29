'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { IssuesListPage } from './IssuesListPage';
import { IssueDetailDrawer } from './IssueDetailDrawer';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import type { IssueWithMetadata } from '../types';

interface AllIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AllIssuesModal({ isOpen, onClose }: AllIssuesModalProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'ready-for-review'>('open');
  const [selectedIssue, setSelectedIssue] = useState<IssueWithMetadata | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl w-full h-[90vh] p-0 flex flex-col">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-2xl font-bold mb-4">All Issues</DialogTitle>
            <DialogDescription className="sr-only">
              View and manage all feedback issues for this page
            </DialogDescription>
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'open' | 'ready-for-review')}>
              <TabsList>
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="ready-for-review">Ready for Review</TabsTrigger>
              </TabsList>
            </Tabs>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-6 py-6">
            <IssuesListPage 
              onViewOnPage={onClose} 
              shouldRefetch={isOpen}
              filter={activeTab}
              onOpenDrawer={(issue) => {
                console.log('AllIssuesModal: Opening drawer for issue:', issue.number);
                setSelectedIssue(issue);
                setIsDrawerOpen(true);
                console.log('AllIssuesModal: Drawer state set to open');
              }}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Issue Detail Drawer - Rendered outside Dialog to avoid z-index conflicts */}
      <IssueDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          console.log('AllIssuesModal: Closing drawer');
          setIsDrawerOpen(false);
          setSelectedIssue(null);
        }}
        issue={selectedIssue}
      />
    </>
  );
}
