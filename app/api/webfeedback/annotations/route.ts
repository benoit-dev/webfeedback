import { NextResponse } from 'next/server';
import { getGitHubConfigFromRequest } from '@/lib/widget/api-helpers';
import { getCorsHeaders } from '@/lib/widget/cors';
import { extractOriginFromHeaders } from '@/lib/widget/domain-validation';

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

export async function POST(request: Request) {
  const requestOrigin = extractOriginFromHeaders(request.headers);
  try {
    const body = await request.json();
    
    // Log request body for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Annotations request body:', {
        pageUrl: body.pageUrl,
        mappingsLength: Array.isArray(body.mappings) ? body.mappings.length : 'not an array',
        mappingsType: typeof body.mappings,
      });
    }
    
    if (!body.pageUrl || typeof body.pageUrl !== 'string' || body.pageUrl.trim() === '') {
      console.error('Invalid or missing pageUrl in request body:', {
        pageUrl: body.pageUrl,
        type: typeof body.pageUrl,
        body,
      });
      return NextResponse.json(
        { error: 'pageUrl is required and must be a non-empty string' },
        { 
          status: 400,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    // Ensure mappings is always an array (default to empty array if missing or invalid)
    const mappings = Array.isArray(body.mappings) ? body.mappings : [];
    
    if (!Array.isArray(body.mappings)) {
      console.warn('mappings is not an array, defaulting to empty array:', {
        mappings: body.mappings,
        type: typeof body.mappings,
      });
    }
    
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
        { 
          status: response.status,
          headers: getCorsHeaders(requestOrigin)
        }
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
      mappings.map(async (mapping: any) => {
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
    
    return NextResponse.json(annotationResults.filter((a: any) => a !== null), {
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
