import type { GitHubIssue, GitHubComment, AnnotationWithComments, IssueWithMetadata } from '../types';
import type { AnnotationMapping } from './storage';
import { getApiEndpoint } from './config';

/**
 * API client for WebFeedback widget
 * Makes REST API calls to the configured endpoint
 */

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const apiEndpoint = getApiEndpoint();
  const url = `${apiEndpoint}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    
    try {
      const errorJson = JSON.parse(errorText);
      errorMessage = errorJson.message || errorJson.error || errorMessage;
    } catch {
      errorMessage = errorText || errorMessage;
    }
    
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Create a new GitHub issue
 */
export async function createIssue(
  title: string,
  body: string,
  labels: string[] = ['feedback', 'annotation']
): Promise<GitHubIssue> {
  return apiRequest<GitHubIssue>('/issues', {
    method: 'POST',
    body: JSON.stringify({ title, body, labels }),
  });
}

/**
 * Get issues filtered by page URL
 */
export async function getIssues(pageUrl: string): Promise<GitHubIssue[]> {
  const params = new URLSearchParams({ pageUrl });
  return apiRequest<GitHubIssue[]>(`/issues?${params.toString()}`);
}

/**
 * Get all issues
 */
export async function getAllIssues(): Promise<IssueWithMetadata[]> {
  return apiRequest<IssueWithMetadata[]>('/issues/all');
}

/**
 * Get comments for a specific issue
 */
export async function getIssueComments(issueNumber: number): Promise<GitHubComment[]> {
  return apiRequest<GitHubComment[]>(`/issues/${issueNumber}/comments`);
}

/**
 * Create a comment on an issue
 */
export async function createIssueComment(
  issueNumber: number,
  body: string
): Promise<GitHubComment> {
  return apiRequest<GitHubComment>(`/issues/${issueNumber}/comments`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
}

/**
 * Get annotations with comments for a page
 */
export async function getAnnotationsWithComments(
  pageUrl: string,
  mappings: AnnotationMapping[]
): Promise<AnnotationWithComments[]> {
  return apiRequest<AnnotationWithComments[]>('/annotations', {
    method: 'POST',
    body: JSON.stringify({ pageUrl, mappings }),
  });
}

