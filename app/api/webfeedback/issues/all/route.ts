import { NextResponse } from 'next/server';
import { getGitHubConfigFromRequest } from '@/lib/widget/api-helpers';
import { getCorsHeaders } from '@/lib/widget/cors';
import { extractOriginFromHeaders } from '@/lib/widget/domain-validation';

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

export async function GET(request: Request) {
  const requestOrigin = extractOriginFromHeaders(request.headers);
  try {
    let config;
    try {
      config = await getGitHubConfigFromRequest(request);
    } catch (error) {
      console.error('Error getting GitHub config:', error);
      return NextResponse.json(
        { error: 'Failed to get GitHub config', details: error instanceof Error ? error.message : String(error) },
        { 
          status: 500,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
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
        { 
          status: response.status,
          headers: getCorsHeaders(requestOrigin)
        }
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
    
    return NextResponse.json(issuesWithMetadata, {
      headers: getCorsHeaders(requestOrigin)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { 
        status: 500,
        headers: getCorsHeaders(requestOrigin)
      }
    );
  }
}

// Handle CORS preflight requests
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
