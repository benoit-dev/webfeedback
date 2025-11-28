import { NextResponse } from 'next/server';

// Parse page URL and element selector from GitHub issue body
function parseIssueBody(body: string) {
  const result = {
    pageUrl: null as string | null,
    elementSelector: null as string | null,
  };

  if (!body) return result;

  // Extract Page URL
  const pageUrlMatch = body.match(/\*\*Page URL:\*\*\s*(.+?)(?:\n|$)/i);
  if (pageUrlMatch) {
    result.pageUrl = pageUrlMatch[1].trim();
  }

  // Extract Element Selector
  const elementSelectorMatch = body.match(/\*\*Element Selector:\*\*\s*\`(.+?)\`/i);
  if (elementSelectorMatch) {
    result.elementSelector = elementSelectorMatch[1].trim();
  }

  return result;
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

export async function GET() {
  try {
    const config = getGitHubConfig();
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
      return NextResponse.json(
        { error: 'Failed to fetch issues', details: error },
        { status: response.status }
      );
    }
    
    const issues = await response.json();
    
    // Parse each issue to extract page URL and element selector
    const issuesWithMetadata = issues.map((issue: any) => {
      const parsed = parseIssueBody(issue.body || '');
      return {
        ...issue,
        parsedPageUrl: parsed.pageUrl,
        parsedElementSelector: parsed.elementSelector,
      };
    });
    
    return NextResponse.json(issuesWithMetadata);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
