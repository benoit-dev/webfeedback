'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { AnnotationList } from './AnnotationList';
import { AnnotationForm } from './AnnotationForm';
import { CommentThread } from './CommentThread';
import type { AnnotationWithComments } from '../types';

interface CommentsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  annotations: AnnotationWithComments[];
  loading: boolean;
  pageUrl: string;
  onRefresh: () => void;
  selectedAnnotation?: AnnotationWithComments | null;
  onClearSelection?: () => void;
}

export function CommentsPanel({
  isOpen,
  onClose,
  annotations,
  loading,
  pageUrl,
  onRefresh,
  selectedAnnotation,
  onClearSelection,
}: CommentsPanelProps) {
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [showAllAnnotations, setShowAllAnnotations] = useState(false);

  // Reset showAllAnnotations when panel closes
  const handleClose = () => {
    setShowAllAnnotations(false);
    onClose();
    if (onClearSelection) {
      onClearSelection();
    }
  };

  // Show selected annotation if provided and not showing all
  const displaySelected = selectedAnnotation && !showAllAnnotations;
  
  // Reset showAllAnnotations when selectedAnnotation changes
  useEffect(() => {
    if (selectedAnnotation) {
      setShowAllAnnotations(false);
    }
  }, [selectedAnnotation]);

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {displaySelected ? (
              selectedAnnotation.issue.title
            ) : (
              <span>Feedback</span>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-6 px-6 pb-6 space-y-4">
          {showAnnotationForm ? (
            <AnnotationForm
              pageUrl={pageUrl}
              onCancel={() => setShowAnnotationForm(false)}
              onSuccess={() => {
                setShowAnnotationForm(false);
                // Force refetch after a short delay to allow GitHub API to index the new issue
                setTimeout(() => {
                  onRefresh();
                }, 1000);
              }}
            />
          ) : displaySelected ? (
            <CommentThread annotation={selectedAnnotation} isHighlighted={true} />
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
                <AnnotationList 
                  annotations={annotations} 
                />
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

