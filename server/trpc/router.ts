import { router, publicProcedure } from '@/lib/trpc/server';
import { createContext } from './context';
import { z } from 'zod';
import { parseIssueBody } from '@/webfeedback/lib/issueParser';
import type { GitHubIssue, GitHubComment, AnnotationWithComments, IssueWithMetadata } from '@/webfeedback/types';
import type { AnnotationMapping } from '@/webfeedback/lib/storage';
import { database } from '@/src/database';
import { widgetCustomers } from '@/src/database/drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import { generateApiKey, isValidApiKey } from '@/lib/widget/generate-key';
import { normalizeDomain } from '@/lib/widget/domain-validation';

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

// Helper function to get the base URL for widget script tags
function getWidgetBaseUrl(): string {
  // Check for explicit production URL
  if (process.env.NEXT_PUBLIC_URL) {
    return process.env.NEXT_PUBLIC_URL;
  }

  // Check for Vercel URL (automatically set by Vercel)
  if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
  }

  // Throw an error if no URL is configured
  throw new Error(
      'NEXT_PUBLIC_URL or NEXT_PUBLIC_VERCEL_URL must be set. Please set NEXT_PUBLIC_URL to your domain (e.g., https://yourdomain.com)'
    );
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

  // Widget customer management procedures
  widget: router({
    customers: router({
      create: publicProcedure
        .input(
          z.object({
            name: z.string().min(1, 'Name is required'),
            githubToken: z.string().min(1, 'GitHub token is required'),
            githubOwner: z.string().min(1, 'GitHub owner is required'),
            githubRepo: z.string().min(1, 'GitHub repo is required'),
            allowedDomains: z.array(z.string()).min(1, 'At least one domain is required'),
            config: z.record(z.string(), z.unknown()).optional(),
          })
        )
        .mutation(async ({ input }) => {
          // Normalize domains
          const normalizedDomains = input.allowedDomains.map(domain => normalizeDomain(domain));

          // Generate unique API key
          let apiKey: string;
          let isUnique = false;
          let attempts = 0;
          const maxAttempts = 10;

          while (!isUnique && attempts < maxAttempts) {
            apiKey = generateApiKey();
            const existing = await database
              .select()
              .from(widgetCustomers)
              .where(eq(widgetCustomers.apiKey, apiKey))
              .limit(1);
            
            if (existing.length === 0) {
              isUnique = true;
            }
            attempts++;
          }

          if (!isUnique) {
            throw new Error('Failed to generate unique API key after multiple attempts');
          }

          // Create customer record
          const [customer] = await database
            .insert(widgetCustomers)
            .values({
              apiKey: apiKey!,
              name: input.name,
              githubToken: input.githubToken, // TODO: Encrypt this
              githubOwner: input.githubOwner,
              githubRepo: input.githubRepo,
              allowedDomains: normalizedDomains,
              config: input.config || {},
              isActive: true,
            })
            .returning();

          // Generate script tag HTML
          const baseUrl = getWidgetBaseUrl();
          const scriptTag = `<script src="${baseUrl}/widget/v1/loader.js?key=${customer.apiKey}"></script>`;

          return {
            id: customer.id,
            apiKey: customer.apiKey,
            name: customer.name,
            scriptTag,
          };
        }),

      list: publicProcedure.query(async () => {
        const customers = await database
          .select({
            id: widgetCustomers.id,
            apiKey: widgetCustomers.apiKey,
            name: widgetCustomers.name,
            githubOwner: widgetCustomers.githubOwner,
            githubRepo: widgetCustomers.githubRepo,
            allowedDomains: widgetCustomers.allowedDomains,
            isActive: widgetCustomers.isActive,
            createdAt: widgetCustomers.createdAt,
            updatedAt: widgetCustomers.updatedAt,
          })
          .from(widgetCustomers)
          .orderBy(desc(widgetCustomers.createdAt));

        return customers;
      }),

      getByKey: publicProcedure
        .input(z.object({ apiKey: z.string() }))
        .query(async ({ input }) => {
          if (!isValidApiKey(input.apiKey)) {
            throw new Error('Invalid API key format');
          }

          const [customer] = await database
            .select()
            .from(widgetCustomers)
            .where(eq(widgetCustomers.apiKey, input.apiKey))
            .limit(1);

          if (!customer) {
            throw new Error('Customer not found');
          }

          // Don't return sensitive GitHub token
          const { githubToken, ...safeCustomer } = customer;
          return safeCustomer;
        }),

      update: publicProcedure
        .input(
          z.object({
            id: z.string().uuid(),
            name: z.string().optional(),
            githubToken: z.string().optional(),
            githubOwner: z.string().optional(),
            githubRepo: z.string().optional(),
            allowedDomains: z.array(z.string()).optional(),
            config: z.record(z.string(), z.unknown()).optional(),
            isActive: z.boolean().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, allowedDomains, ...updateData } = input;

          const updateValues: Partial<typeof widgetCustomers.$inferInsert> = {
            ...updateData,
            updatedAt: new Date(),
          };

          // Normalize domains if provided
          if (allowedDomains) {
            updateValues.allowedDomains = allowedDomains.map(domain => normalizeDomain(domain));
          }

          const [updated] = await database
            .update(widgetCustomers)
            .set(updateValues)
            .where(eq(widgetCustomers.id, id))
            .returning();

          if (!updated) {
            throw new Error('Customer not found');
          }

          // Don't return sensitive GitHub token
          const { githubToken, ...safeCustomer } = updated;
          return safeCustomer;
        }),

      deactivate: publicProcedure
        .input(z.object({ id: z.string().uuid() }))
        .mutation(async ({ input }) => {
          const [updated] = await database
            .update(widgetCustomers)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(widgetCustomers.id, input.id))
            .returning();

          if (!updated) {
            throw new Error('Customer not found');
          }

          return { success: true, id: updated.id };
        }),

      generateScriptTag: publicProcedure
        .input(z.object({ apiKey: z.string() }))
        .query(async ({ input }) => {
          if (!isValidApiKey(input.apiKey)) {
            throw new Error('Invalid API key format');
          }

          const baseUrl = getWidgetBaseUrl();
          return `<script src="${baseUrl}/widget/v1/loader.js?key=${input.apiKey}"></script>`;
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;

