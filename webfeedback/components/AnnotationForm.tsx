'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getConfig } from '../lib/config';
import { createGitHubIssue } from '../lib/github';
import { saveAnnotationMapping } from '../lib/storage';

interface AnnotationFormProps {
  pageUrl: string;
  initialElementSelector?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function AnnotationForm({ 
  pageUrl, 
  initialElementSelector = '',
  onCancel, 
  onSuccess 
}: AnnotationFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [elementSelector, setElementSelector] = useState(initialElementSelector);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialElementSelector) {
      setElementSelector(initialElementSelector);
    }
  }, [initialElementSelector]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!elementSelector) {
      setError('Please select an element on the page');
      return;
    }

    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }

    setIsSubmitting(true);

    try {
      const config = getConfig();
      
      // Create issue body with annotation details
      const issueBody = `## Annotation Details

**Page URL:** ${pageUrl}
**Element Selector:** \`${elementSelector}\`

---

${description || 'No additional description provided.'}`;

      // Create GitHub issue
      const issue = await createGitHubIssue(config, title, issueBody);

      // Save mapping
      saveAnnotationMapping({
        elementSelector,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        createdAt: new Date().toISOString(),
        pageUrl,
      });

      // Show success toast
      toast.success('Annotation created successfully', {
        description: 'The comment icon will appear on the page shortly.',
      });

      // Call onSuccess to trigger refetch
      onSuccess();
    } catch (err) {
      const errorMessage = err instanceof Error
        ? err.message
        : 'Failed to create annotation. Please try again.';
      
      // Show error toast
      toast.error('Failed to create annotation', {
        description: errorMessage,
      });
      
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Create Annotation</h2>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Button color issue"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details about this annotation..."
              rows={4}
            />
          </div>

          {error && (
            <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              {error}
            </div>
          )}

          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Annotation'
              )}
            </Button>
          </div>
        </form>
    </div>
  );
}

