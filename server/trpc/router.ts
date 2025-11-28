import { router, publicProcedure } from '@/lib/trpc/server';
import { createContext } from './context';
import { z } from 'zod';
import { parseIssueBody } from '@/webfeedback/lib/issueParser';
import type { GitHubIssue, GitHubComment, AnnotationWithComments, IssueWithMetadata } from '@/webfeedback/types';
import type { AnnotationMapping } from '@/webfeedback/lib/storage';

// Helper to get GitHub config from provided credentials or server-side env vars
function getGitHubConfig(provided?: {
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
}) {
  const token = provided?.githubToken || process.env.GITHUB_TOKEN;
  const owner = provided?.githubOwner || process.env.GITHUB_OWNER;
  const repo = provided?.githubRepo || process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error(
      'Missing GitHub configuration. Provide githubToken, githubOwner, and githubRepo in the request, or set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables.'
    );
  }

  return { token, owner, repo };
}

// Helper function to normalize URL to pathname + search for comparison
function normalizeUrlForComparison(url: string): string {
  try {
    // If it's already a pathname (starts with /), return as is
    if (url.startsWith('/')) {
      return url;
    }
    // If it's a full URL, extract pathname + search
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    // If URL parsing fails, try to extract pathname manually
    const match = url.match(/\/\/[^\/]+(\/.*?)(?:\?|$)/);
    return match ? match[1] : url;
  }
}

export const appRouter = router({
  // Example: health check
  health: publicProcedure.query(() => {
    return { status: 'ok' };
  }),

  // GitHub issue comments procedures
  github: router({
    getIssueComments: publicProcedure
      .input(
        z.object({
          issueNumber: z.number(),
          githubToken: z.string().optional(),
          githubOwner: z.string().optional(),
          githubRepo: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const config = getGitHubConfig({
          githubToken: input.githubToken,
          githubOwner: input.githubOwner,
          githubRepo: input.githubRepo,
        });
        const response = await fetch(
          `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${input.issueNumber}/comments`,
          {
            headers: {
              'Authorization': `token ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch GitHub issue comments: ${error}`);
        }

        return response.json();
      }),

    createIssueComment: publicProcedure
      .input(
        z.object({
          issueNumber: z.number(),
          body: z.string().min(1, 'Comment body is required'),
          githubToken: z.string().optional(),
          githubOwner: z.string().optional(),
          githubRepo: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const config = getGitHubConfig({
          githubToken: input.githubToken,
          githubOwner: input.githubOwner,
          githubRepo: input.githubRepo,
        });
        const response = await fetch(
          `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${input.issueNumber}/comments`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              body: input.body,
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create GitHub issue comment: ${error}`);
        }

        return response.json();
      }),

    createIssue: publicProcedure
      .input(
        z.object({
          title: z.string().min(1, 'Title is required'),
          body: z.string(),
          labels: z.array(z.string()).optional(),
          githubToken: z.string().optional(),
          githubOwner: z.string().optional(),
          githubRepo: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const config = getGitHubConfig({
          githubToken: input.githubToken,
          githubOwner: input.githubOwner,
          githubRepo: input.githubRepo,
        });
        const response = await fetch(
          `https://api.github.com/repos/${config.owner}/${config.repo}/issues`,
          {
            method: 'POST',
            headers: {
              'Authorization': `token ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: input.title,
              body: input.body,
              labels: input.labels && input.labels.length > 0 
                ? input.labels 
                : ['feedback'],
            }),
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to create GitHub issue: ${error}`);
        }

        return response.json() as Promise<GitHubIssue>;
      }),

    getIssues: publicProcedure
      .input(
        z.object({
          pageUrl: z.string(),
          githubToken: z.string().optional(),
          githubOwner: z.string().optional(),
          githubRepo: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const config = getGitHubConfig({
          githubToken: input.githubToken,
          githubOwner: input.githubOwner,
          githubRepo: input.githubRepo,
        });
        const labels = ['feedback'].join(',');
        const response = await fetch(
          `https://api.github.com/repos/${config.owner}/${config.repo}/issues?labels=${labels}&state=open`,
          {
            headers: {
              'Authorization': `token ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch GitHub issues: ${error}`);
        }

        const issues: GitHubIssue[] = await response.json();

        // Normalize the search URL
        const normalizedSearchUrl = normalizeUrlForComparison(input.pageUrl);

        // Filter issues that contain the page URL in the body
        const filteredIssues = issues.filter((issue) => {
          if (!issue.body) return false;
          
          // Check if body contains the normalized URL
          if (issue.body.includes(normalizedSearchUrl)) {
            return true;
          }
          
          // Also check for the original URL format (for backward compatibility)
          if (issue.body.includes(input.pageUrl)) {
            return true;
          }
          
          // Extract URL from issue body and normalize for comparison
          const pageUrlMatch = issue.body.match(/\*\*Page URL:\*\*\s*(.+?)(?:\n|$)/i);
          if (pageUrlMatch) {
            const storedUrl = pageUrlMatch[1].trim();
            const normalizedStoredUrl = normalizeUrlForComparison(storedUrl);
            return normalizedStoredUrl === normalizedSearchUrl;
          }
          
          return false;
        });

        return filteredIssues;
      }),

    getAllIssues: publicProcedure
      .input(
        z.object({
          githubToken: z.string().optional(),
          githubOwner: z.string().optional(),
          githubRepo: z.string().optional(),
        }).optional()
      )
      .query(async ({ input }) => {
        const config = getGitHubConfig({
          githubToken: input?.githubToken,
          githubOwner: input?.githubOwner,
          githubRepo: input?.githubRepo,
        });
        const labels = ['feedback'].join(',');
        const response = await fetch(
          `https://api.github.com/repos/${config.owner}/${config.repo}/issues?labels=${labels}&state=open&per_page=100`,
          {
            headers: {
              'Authorization': `token ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch GitHub issues: ${error}`);
        }

        const issues: GitHubIssue[] = await response.json();

        // Parse each issue to extract page URL and element selector
        const issuesWithMetadata: IssueWithMetadata[] = issues.map((issue) => {
          const parsed = parseIssueBody(issue.body || '');
          return {
            ...issue,
            parsedPageUrl: parsed.pageUrl,
            parsedElementSelector: parsed.elementSelector,
          };
        });

        return issuesWithMetadata;
      }),

    getAnnotationsWithComments: publicProcedure
      .input(
        z.object({
          pageUrl: z.string(),
          mappings: z.array(
            z.object({
              elementSelector: z.string(),
              issueNumber: z.number(),
              issueUrl: z.string(),
              createdAt: z.string(),
              pageUrl: z.string(),
            })
          ),
          githubToken: z.string().optional(),
          githubOwner: z.string().optional(),
          githubRepo: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const config = getGitHubConfig({
          githubToken: input.githubToken,
          githubOwner: input.githubOwner,
          githubRepo: input.githubRepo,
        });
        
        // Fetch all issues for this page
        const labels = ['feedback'].join(',');
        const response = await fetch(
          `https://api.github.com/repos/${config.owner}/${config.repo}/issues?labels=${labels}&state=open`,
          {
            headers: {
              'Authorization': `token ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to fetch GitHub issues: ${error}`);
        }

        const issues: GitHubIssue[] = await response.json();

        // Filter issues that match the page URL
        const normalizedSearchUrl = normalizeUrlForComparison(input.pageUrl);
        const filteredIssues = issues.filter((issue) => {
          if (!issue.body) return false;
          
          if (issue.body.includes(normalizedSearchUrl)) {
            return true;
          }
          
          if (issue.body.includes(input.pageUrl)) {
            return true;
          }
          
          const pageUrlMatch = issue.body.match(/\*\*Page URL:\*\*\s*(.+?)(?:\n|$)/i);
          if (pageUrlMatch) {
            const storedUrl = pageUrlMatch[1].trim();
            const normalizedStoredUrl = normalizeUrlForComparison(storedUrl);
            return normalizedStoredUrl === normalizedSearchUrl;
          }
          
          return false;
        });

        // Combine mappings with issues and fetch comments
        const annotationResults = await Promise.all(
          input.mappings.map(async (mapping) => {
            const issue = filteredIssues.find((i) => i.number === mapping.issueNumber);
            if (!issue) {
              // Issue might have been deleted or doesn't match filters
              return null;
            }

            // Fetch comments for this issue
            const commentsResponse = await fetch(
              `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${mapping.issueNumber}/comments`,
              {
                headers: {
                  'Authorization': `token ${config.token}`,
                  'Accept': 'application/vnd.github.v3+json',
                },
              }
            );

            if (!commentsResponse.ok) {
              // If comments fail, still return the annotation without comments
              return {
                id: `${mapping.elementSelector}_${mapping.pageUrl}`,
                elementSelector: mapping.elementSelector,
                pageUrl: mapping.pageUrl,
                issueNumber: mapping.issueNumber,
                issueUrl: mapping.issueUrl,
                createdAt: mapping.createdAt,
                issue,
                comments: [],
                commentCount: 0,
              };
            }

            const comments: GitHubComment[] = await commentsResponse.json();

            return {
              id: `${mapping.elementSelector}_${mapping.pageUrl}`,
              elementSelector: mapping.elementSelector,
              pageUrl: mapping.pageUrl,
              issueNumber: mapping.issueNumber,
              issueUrl: mapping.issueUrl,
              createdAt: mapping.createdAt,
              issue,
              comments,
              commentCount: comments.length,
            } as AnnotationWithComments;
          })
        );

        return annotationResults.filter((a): a is AnnotationWithComments => a !== null);
      }),
  }),
});

export type AppRouter = typeof appRouter;

