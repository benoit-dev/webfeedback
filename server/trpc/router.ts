import { router, publicProcedure } from '@/lib/trpc/server';
import { createContext } from './context';
import { z } from 'zod';

// Helper to get GitHub config from server-side env vars
function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN || process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || process.env.NEXT_PUBLIC_GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO || process.env.NEXT_PUBLIC_GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error(
      'Missing GitHub configuration. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables.'
    );
  }

  return { token, owner, repo };
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
        })
      )
      .query(async ({ input }) => {
        const config = getGitHubConfig();
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
        })
      )
      .mutation(async ({ input }) => {
        const config = getGitHubConfig();
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
  }),
});

export type AppRouter = typeof appRouter;

