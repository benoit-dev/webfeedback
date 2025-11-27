import type { GitHubConfig } from '../types';

let config: GitHubConfig | null = null;

export function setupConfig(newConfig: GitHubConfig) {
  config = newConfig;
}

export function getConfig(): GitHubConfig {
  if (!config) {
    throw new Error(
      'WebFeedback not configured. Call setupConfig() with your GitHub credentials.'
    );
  }
  return config;
}

// Helper to get config from environment variables
export function getConfigFromEnv(): GitHubConfig {
  const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN;
  const owner = process.env.NEXT_PUBLIC_GITHUB_OWNER;
  const repo = process.env.NEXT_PUBLIC_GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error(
      'Missing GitHub configuration. Set NEXT_PUBLIC_GITHUB_TOKEN, NEXT_PUBLIC_GITHUB_OWNER, and NEXT_PUBLIC_GITHUB_REPO environment variables.'
    );
  }

  return {
    token,
    owner,
    repo,
    labels: ['feedback', 'annotation'],
  };
}

