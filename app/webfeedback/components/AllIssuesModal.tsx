'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { IssuesListPage } from './IssuesListPage';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { setupConfig, getConfigFromEnv } from '../lib/config';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface AllIssuesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AllIssuesModal({ isOpen, onClose }: AllIssuesModalProps) {
  const [configReady, setConfigReady] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'open' | 'ready-for-review'>('open');

  useEffect(() => {
    if (isOpen) {
      try {
        // Configure from environment variables
        const config = getConfigFromEnv();
        setupConfig(config);
        setConfigReady(true);
        setConfigError(null);
      } catch (error) {
        // If env vars are not set, show error
        setConfigError(
          'GitHub configuration not found. Please set NEXT_PUBLIC_GITHUB_TOKEN, NEXT_PUBLIC_GITHUB_OWNER, and NEXT_PUBLIC_GITHUB_REPO in your .env.local file.'
        );
        setConfigReady(true);
      }
    }
  }, [isOpen]);

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
          {configReady ? (
            <IssuesListPage 
              configError={configError} 
              onViewOnPage={onClose} 
              shouldRefetch={isOpen}
              filter={activeTab}
            />
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              Loading...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
