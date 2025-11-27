'use client';

import { useState, useEffect } from 'react';
import { MessageSquare, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CommentsPanel } from './CommentsPanel';
import { AnnotationMarkers } from './AnnotationMarkers';
import { AnnotationForm } from './AnnotationForm';
import { useAnnotations } from '../hooks/useAnnotations';
import { useElementSelection } from '../hooks/useElementSelection';

interface FloatingWidgetProps {
  className?: string;
}

export function FloatingWidget({ className }: FloatingWidgetProps) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [selectedElementSelector, setSelectedElementSelector] = useState('');
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    // Get current page URL
    setPageUrl(window.location.href);
  }, []);

  const { annotations, loading, refresh } = useAnnotations(pageUrl);
  const totalComments = annotations.reduce(
    (sum, ann) => sum + ann.commentCount,
    0
  );

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

  const handleAnnotationSuccess = () => {
    setShowAnnotationForm(false);
    setSelectedElementSelector('');
    refresh();
  };

  return (
    <>
      <div
        className={`fixed bottom-6 right-6 z-50 flex flex-col gap-3 ${className || ''}`}
        style={{ position: 'fixed' }}
        data-webfeedback="widget"
      >
        {/* View Comments Button */}
        {totalComments > 0 && (
          <Button
            onClick={() => setIsPanelOpen(true)}
            size="lg"
            variant="outline"
            className="rounded-full h-12 w-12 shadow-lg hover:shadow-xl transition-all"
          >
            <List className="h-5 w-5" />
            <Badge
              variant="destructive"
              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center px-1"
            >
              {totalComments}
            </Badge>
          </Button>
        )}

        {/* Main Widget Button */}
        <Button
          onClick={handleWidgetClick}
          size="lg"
          variant={isSelecting ? 'destructive' : 'default'}
          className="rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>

      {/* Comments Panel */}
      <CommentsPanel
        isOpen={isPanelOpen}
        onClose={() => setIsPanelOpen(false)}
        annotations={annotations}
        loading={loading}
        pageUrl={pageUrl}
        onRefresh={refresh}
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

      <AnnotationMarkers annotations={annotations} />
    </>
  );
}

