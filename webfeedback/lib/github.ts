import type {
  GitHubConfig,
  GitHubIssue,
  GitHubComment,
  AnnotationWithComments,
} from '../types';
import { getMappingsForPage } from './storage';
import { parseIssueBody } from './issueParser';

export interface IssueWithMetadata extends GitHubIssue {
  parsedPageUrl: string | null;
  parsedElementSelector: string | null;
}

export async function createGitHubIssue(
  config: GitHubConfig,
  title: string,
  body: string,
  labels: string[] = []
): Promise<GitHubIssue> {
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
        title,
        body,
        labels: labels.length > 0 ? labels : config.labels || ['feedback'],
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create GitHub issue: ${error}`);
  }

  return response.json();
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

export async function getGitHubIssues(
  config: GitHubConfig,
  pageUrl: string
): Promise<GitHubIssue[]> {
  // Fetch issues with labels that match our feedback labels (only open issues)
  const labels = (config.labels || ['feedback']).join(',');
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
  const normalizedSearchUrl = normalizeUrlForComparison(pageUrl);

  // Filter issues that contain the page URL in the body
  // Match both the original URL format and normalized format for backward compatibility
  return issues.filter((issue) => {
    if (!issue.body) return false;
    
    // Check if body contains the normalized URL
    if (issue.body.includes(normalizedSearchUrl)) {
      return true;
    }
    
    // Also check for the original URL format (for backward compatibility)
    if (issue.body.includes(pageUrl)) {
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
}

export async function getGitHubIssueComments(
  config: GitHubConfig,
  issueNumber: number
): Promise<GitHubComment[]> {
  const response = await fetch(
    `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${issueNumber}/comments`,
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
}

export async function getAnnotationsWithComments(
  config: GitHubConfig,
  pageUrl: string
): Promise<AnnotationWithComments[]> {
  const mappings = getMappingsForPage(pageUrl);
  const issues = await getGitHubIssues(config, pageUrl);

  const annotationResults = await Promise.all(
    mappings.map(async (mapping) => {
      const issue = issues.find((i) => i.number === mapping.issueNumber);
      if (!issue) {
        // Issue might have been deleted or doesn't match filters
        return null;
      }

      const comments = await getGitHubIssueComments(config, mapping.issueNumber);

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
      };
    })
  );

  return annotationResults.filter((a): a is AnnotationWithComments => a !== null);
}

export async function getAllIssues(
  config: GitHubConfig
): Promise<IssueWithMetadata[]> {
  // Fetch issues with labels that match our feedback labels (only open issues)
  const labels = (config.labels || ['feedback']).join(',');
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
  return issues.map((issue) => {
    const parsed = parseIssueBody(issue.body || '');
    return {
      ...issue,
      parsedPageUrl: parsed.pageUrl,
      parsedElementSelector: parsed.elementSelector,
    };
  });
}

