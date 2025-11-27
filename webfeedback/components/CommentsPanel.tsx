'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import { AnnotationList } from './AnnotationList';
import { AnnotationForm } from './AnnotationForm';
import type { AnnotationWithComments } from '../types';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  annotations: AnnotationWithComments[];
  loading: boolean;
  pageUrl: string;
  onRefresh: () => void;
}

export function CommentsPanel({
  isOpen,
  onClose,
  annotations,
  loading,
  pageUrl,
  onRefresh,
}: CommentsPanelProps) {
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <span>Feedback</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {showAnnotationForm ? (
            <AnnotationForm
              pageUrl={pageUrl}
              onCancel={() => setShowAnnotationForm(false)}
              onSuccess={() => {
                setShowAnnotationForm(false);
                onRefresh();
              }}
            />
          ) : (
            <>
              <Button
                onClick={() => setShowAnnotationForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Annotation
              </Button>

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading annotations...
                </div>
              ) : annotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No annotations yet. Click &quot;Add Annotation&quot; to get started.
                </div>
              ) : (
                <AnnotationList annotations={annotations} />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

