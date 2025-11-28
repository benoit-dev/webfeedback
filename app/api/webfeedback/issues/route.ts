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
    const config = getGitHubConfig();
    
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
          title: body.title,
          body: body.body,
          labels: body.labels && body.labels.length > 0 ? body.labels : ['feedback'],
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to create issue', details: error },
        { status: response.status }
      );
    }
    
    return NextResponse.json(await response.json());
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageUrl = searchParams.get('pageUrl');
    
    if (!pageUrl) {
      return NextResponse.json(
        { error: 'pageUrl parameter is required' },
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
    
    // Normalize the search URL
    const normalizedSearchUrl = normalizeUrlForComparison(pageUrl);
    
    // Filter issues that contain the page URL in the body
    const filteredIssues = issues.filter((issue: any) => {
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
    
    return NextResponse.json(filteredIssues);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
