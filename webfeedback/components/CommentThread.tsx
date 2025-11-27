'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AnnotationWithComments } from '../types';
import { formatDistanceToNow } from 'date-fns';

interface CommentThreadProps {
  annotation: AnnotationWithComments;
}

export function CommentThread({ annotation }: CommentThreadProps) {
  const handleScrollToElement = () => {
    try {
      const element = document.querySelector(annotation.elementSelector);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Highlight element briefly
        element.classList.add('ring-2', 'ring-blue-500', 'ring-offset-2');
        setTimeout(() => {
          element.classList.remove('ring-2', 'ring-blue-500', 'ring-offset-2');
        }, 2000);
      }
    } catch (err) {
      console.error('Failed to scroll to element:', err);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span className="truncate">{annotation.elementSelector}</span>
          </CardTitle>
          <Badge variant={annotation.issue.state === 'open' ? 'default' : 'secondary'}>
            {annotation.issue.state}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          {annotation.issue.title}
        </div>

        {annotation.comments.length > 0 && (
          <div className="space-y-3 border-t pt-3">
            {annotation.comments.map((comment) => (
              <div key={comment.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <img
                    src={comment.user.avatar_url}
                    alt={comment.user.login}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-sm font-medium">{comment.user.login}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
                <div className="text-sm pl-8">{comment.body}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 pt-2 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={handleScrollToElement}
            className="flex-1"
          >
            <MapPin className="h-3 w-3 mr-1" />
            View on Page
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(annotation.issueUrl, '_blank')}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

