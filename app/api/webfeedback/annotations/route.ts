import { NextResponse } from 'next/server';

// Helper function to normalize URL to pathname + search for comparison
function normalizeUrlForComparison(url: string): string {
  try {
    if (url.startsWith('/')) {
      return url;
    }
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    const match = url.match(/\/\/[^\/]+(\/.*?)(?:\?|$)/);
    return match ? match[1] : url;
  }
}

// Helper to get GitHub config from environment variables
function getGitHubConfig() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    throw new Error(
      'Missing GitHub configuration. Set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO environment variables.'
    );
  }

  return { token, owner, repo };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    if (!body.pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl is required' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(body.mappings)) {
      return NextResponse.json(
        { error: 'mappings must be an array' },
        { status: 400 }
      );
    }
    
    const config = getGitHubConfig();
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
      return NextResponse.json(
        { error: 'Failed to fetch issues', details: error },
        { status: response.status }
      );
    }
    
    const issues = await response.json();
    
    // Filter issues that match the page URL
    const normalizedSearchUrl = normalizeUrlForComparison(body.pageUrl);
    const filteredIssues = issues.filter((issue: any) => {
      if (!issue.body) return false;
      
      if (issue.body.includes(normalizedSearchUrl)) {
        return true;
      }
      
      if (issue.body.includes(body.pageUrl)) {
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
      body.mappings.map(async (mapping: any) => {
        const issue = filteredIssues.find((i: any) => i.number === mapping.issueNumber);
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

        const comments = await commentsResponse.json();

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
    
    return NextResponse.json(annotationResults.filter((a: any) => a !== null));
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
