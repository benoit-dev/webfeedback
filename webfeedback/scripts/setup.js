#!/usr/bin/env node

/**
 * WebFeedback Setup Script
 * Generates API route files for Next.js App Router that call GitHub API directly
 */

const fs = require('fs');
const path = require('path');

// Helper function to normalize URL to pathname + search for comparison
function normalizeUrlForComparison(url) {
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

// Parse page URL and element selector from GitHub issue body
function parseIssueBody(body) {
  const result = {
    pageUrl: null,
    elementSelector: null,
  };

  if (!body) return result;

  // Extract Page URL
  const pageUrlMatch = body.match(/\*\*Page URL:\*\*\s*(.+?)(?:\n|$)/i);
  if (pageUrlMatch) {
    result.pageUrl = pageUrlMatch[1].trim();
  }

  // Extract Element Selector
  const elementSelectorMatch = body.match(/\*\*Element Selector:\*\*\s*`(.+?)`/i);
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

const routes = {
  'app/api/webfeedback/issues/route.ts': `import { NextResponse } from 'next/server';

// Helper function to normalize URL to pathname + search for comparison
function normalizeUrlForComparison(url: string): string {
  try {
    if (url.startsWith('/')) {
      return url;
    }
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    const match = url.match(/\\/\\/[^\\/]+(\\/.*?)(?:\\?|$)/);
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
      \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`token \${config.token}\`,
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
      \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues?labels=\${labels}&state=open\`,
      {
        headers: {
          'Authorization': \`token \${config.token}\`,
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
      const pageUrlMatch = issue.body.match(/\\*\\*Page URL:\\*\\*\\s*(.+?)(?:\\n|$)/i);
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
`,

  'app/api/webfeedback/issues/all/route.ts': `import { NextResponse } from 'next/server';

// Parse page URL and element selector from GitHub issue body
function parseIssueBody(body: string) {
  const result = {
    pageUrl: null as string | null,
    elementSelector: null as string | null,
  };

  if (!body) return result;

  // Extract Page URL
  const pageUrlMatch = body.match(/\\*\\*Page URL:\\*\\*\\s*(.+?)(?:\\n|$)/i);
  if (pageUrlMatch) {
    result.pageUrl = pageUrlMatch[1].trim();
  }

  // Extract Element Selector
  const elementSelectorMatch = body.match(/\\*\\*Element Selector:\\*\\*\\s*\\\`(.+?)\\\`/i);
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
      \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues?labels=\${labels}&state=open&per_page=100\`,
      {
        headers: {
          'Authorization': \`token \${config.token}\`,
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
`,

  'app/api/webfeedback/issues/[id]/comments/route.ts': `import { NextResponse } from 'next/server';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issueNumber = parseInt(id);
    
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }
    
    const config = getGitHubConfig();
    const response = await fetch(
      \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues/\${issueNumber}/comments\`,
      {
        headers: {
          'Authorization': \`token \${config.token}\`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error },
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

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const issueNumber = parseInt(id);
    const body = await request.json();
    
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }
    
    if (!body.body) {
      return NextResponse.json(
        { error: 'Comment body is required' },
        { status: 400 }
      );
    }
    
    const config = getGitHubConfig();
    const response = await fetch(
      \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues/\${issueNumber}/comments\`,
      {
        method: 'POST',
        headers: {
          'Authorization': \`token \${config.token}\`,
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
`,

  'app/api/webfeedback/annotations/route.ts': `import { NextResponse } from 'next/server';

// Helper function to normalize URL to pathname + search for comparison
function normalizeUrlForComparison(url: string): string {
  try {
    if (url.startsWith('/')) {
      return url;
    }
    const urlObj = new URL(url);
    return urlObj.pathname + urlObj.search;
  } catch {
    const match = url.match(/\\/\\/[^\\/]+(\\/.*?)(?:\\?|$)/);
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
      \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues?labels=\${labels}&state=open\`,
      {
        headers: {
          'Authorization': \`token \${config.token}\`,
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
      
      const pageUrlMatch = issue.body.match(/\\*\\*Page URL:\\*\\*\\s*(.+?)(?:\\n|$)/i);
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
          \`https://api.github.com/repos/\${config.owner}/\${config.repo}/issues/\${mapping.issueNumber}/comments\`,
          {
            headers: {
              'Authorization': \`token \${config.token}\`,
              'Accept': 'application/vnd.github.v3+json',
            },
          }
        );

        if (!commentsResponse.ok) {
          // If comments fail, still return the annotation without comments
          return {
            id: \`\${mapping.elementSelector}_\${mapping.pageUrl}\`,
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
          id: \`\${mapping.elementSelector}_\${mapping.pageUrl}\`,
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
`,
};

function createFile(filePath, content) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  // Check if file already exists
  if (fs.existsSync(fullPath)) {
    console.log(`⚠️  File already exists: ${filePath}`);
    console.log(`   Skipping... (delete it first if you want to regenerate)`);
    return false;
  }
  
  // Write file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Created: ${filePath}`);
  return true;
}

function main() {
  console.log('\n🚀 WebFeedback Setup Script\n');
  console.log('Generating API route files that call GitHub API directly...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const [filePath, content] of Object.entries(routes)) {
    if (createFile(filePath, content)) {
      created++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n✨ Done! Created ${created} file(s), skipped ${skipped} existing file(s).\n`);
  console.log('Next steps:');
  console.log('1. Set environment variables in .env.local:');
  console.log('   GITHUB_TOKEN=your_github_personal_access_token');
  console.log('   GITHUB_OWNER=your_github_username_or_org');
  console.log('   GITHUB_REPO=your_repository_name');
  console.log('2. Initialize the widget in your app:\n');
  console.log('   import { FloatingWidget, init } from "webfeedback";');
  console.log('   init({ apiEndpoint: "/api/webfeedback" });');
  console.log('   <FloatingWidget />\n');
}

if (require.main === module) {
  main();
}

module.exports = { createFile, routes };
