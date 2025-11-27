'use client';

import { Label } from '@/components/ui/label';
import type { AnnotationWithComments } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
  annotation: AnnotationWithComments;
  isHighlighted?: boolean;
}

function extractDescription(body: string): string {
  if (!body) return '';
  
  // Find the description part after the "---" separator
  const separatorIndex = body.indexOf('---');
  if (separatorIndex === -1) {
    // If no separator, return empty or a default message
    return '';
  }
  
  // Get everything after the separator and trim
  const description = body.substring(separatorIndex + 3).trim();
  
  // Remove any leading/trailing whitespace and return
  return description || 'No description provided.';
}

export function CommentThread({ annotation, isHighlighted = false }: CommentThreadProps) {
  const description = extractDescription(annotation.issue.body || '');

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Description</Label>
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {description}
        </div>
      </div>

      {annotation.comments.length > 0 && (
        <div className="space-y-3 border-t pt-4">
          <Label className="text-sm font-medium">Comments</Label>
          <div className="space-y-4">
            {annotation.comments.map((comment) => (
              <div key={comment.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {comment.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

