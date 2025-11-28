'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from './ui/sheet';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import { getIssueComments, createIssueComment } from '../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send } from 'lucide-react';
import type { IssueWithMetadata } from '../types';
import type { GitHubComment } from '../types';

interface IssueDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  issue: IssueWithMetadata | null;
}

function extractDescription(body: string): string {
  if (!body) return '';
  
  // Find the description part after the "---" separator
  const separatorIndex = body.indexOf('---');
  if (separatorIndex === -1) {
    // If no separator, return the full body or a default message
    return body || 'No description provided.';
  }
  
  // Get everything after the separator and trim
  const description = body.substring(separatorIndex + 3).trim();
  
  // Remove any leading/trailing whitespace and return
  return description || 'No description provided.';
}

export function IssueDetailDrawer({ isOpen, onClose, issue }: IssueDetailDrawerProps) {
  const [commentBody, setCommentBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [comments, setComments] = useState<GitHubComment[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  useEffect(() => {
    if (isOpen && issue && issue.number > 0) {
      async function fetchComments() {
        if (!issue) return;
        try {
          setIsLoadingComments(true);
          const fetchedComments = await getIssueComments(issue.number);
          setComments(fetchedComments);
        } catch (error) {
          console.error('Failed to fetch comments:', error);
          setComments([]);
        } finally {
          setIsLoadingComments(false);
        }
      }
      fetchComments();
    } else {
      setComments([]);
    }
  }, [isOpen, issue]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !commentBody.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createIssueComment(issue.number, commentBody.trim());
      setCommentBody('');
      // Refetch comments
      if (issue) {
        const fetchedComments = await getIssueComments(issue.number);
        setComments(fetchedComments);
      }
    } catch (error) {
      console.error('Failed to create comment:', error);
      alert('Failed to create comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const description = issue ? extractDescription(issue.body || '') : '';
  const issueComments: GitHubComment[] = comments;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-[540px] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>
            {issue?.title || 'Issue Details'}
          </SheetTitle>
        </SheetHeader>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Description Section */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Description</Label>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {description}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-sm font-medium">
              Comments {issueComments.length > 0 && `(${issueComments.length})`}
            </Label>
            
            {isLoadingComments ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading comments...</span>
              </div>
            ) : issueComments.length > 0 ? (
              <div className="space-y-4">
                {issueComments.map((comment) => (
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
            ) : (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No comments yet. Be the first to comment!
              </div>
            )}
          </div>
        </div>

        {/* Add Comment Form - Docked at bottom */}
        <div className="border-t bg-background px-6 py-4">
          <form onSubmit={handleSubmitComment} className="space-y-3">
            <Textarea
              id="comment"
              placeholder="Write your comment here..."
              value={commentBody}
              onChange={(e) => setCommentBody(e.target.value)}
              rows={4}
              disabled={isSubmitting}
              className="w-full"
            />
            <Button
              type="submit"
              disabled={!commentBody.trim() || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Post Comment
                </>
              )}
            </Button>
          </form>
        </div>
      </SheetContent>
    </Sheet>
  );
}

