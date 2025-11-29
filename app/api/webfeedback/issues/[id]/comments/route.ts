import { NextResponse } from 'next/server';
import { getGitHubConfigFromRequest } from '@/lib/widget/api-helpers';
import { getCorsHeaders } from '@/lib/widget/cors';
import { extractOriginFromHeaders } from '@/lib/widget/domain-validation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestOrigin = extractOriginFromHeaders(request.headers);
  try {
    const { id } = await params;
    const issueNumber = parseInt(id);
    
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { 
          status: 400,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    const config = await getGitHubConfigFromRequest(request);
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
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error },
        { 
          status: response.status,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    return NextResponse.json(await response.json(), {
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestOrigin = extractOriginFromHeaders(request.headers);
  try {
    const { id } = await params;
    const issueNumber = parseInt(id);
    const body = await request.json();
    
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { 
          status: 400,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    if (!body.body) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { 
          status: 400,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    const config = await getGitHubConfigFromRequest(request);
    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/issues/${issueNumber}/comments`,
      {
        method: 'POST',
        headers: {
          'Authorization': `token ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          body: body.body,
        }),
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to create comment', details: error },
        { 
          status: response.status,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    return NextResponse.json(await response.json(), {
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
