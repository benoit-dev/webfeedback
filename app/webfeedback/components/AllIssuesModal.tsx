'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IssuesListPage } from './IssuesListPage';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AllIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AllIssuesModal({ isOpen, onClose }: AllIssuesModalProps) {
  const [activeTab, setActiveTab] = useState<'open' | 'ready-for-review'>('open');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full h-[90vh] p-0 flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-2xl font-bold mb-4">All Issues</DialogTitle>
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
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
