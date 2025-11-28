#!/usr/bin/env node

/**
 * WebFeedback Setup Script
 * Generates API route files for Next.js App Router
 */

const fs = require('fs');
const path = require('path');

const API_ENDPOINT_PLACEHOLDER = 'YOUR_API_SERVER_URL';

const routes = {
  'app/api/webfeedback/issues/route.ts': `import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Forward to WebFeedback API with your GitHub credentials
    const response = await fetch('${API_ENDPOINT_PLACEHOLDER}/api/trpc/github.createIssue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          ...body,
          githubToken: process.env.GITHUB_TOKEN,
          githubOwner: process.env.GITHUB_OWNER,
          githubRepo: process.env.GITHUB_REPO,
        }
      }),
    });
    
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
    
    const response = await fetch(
      \`\${'${API_ENDPOINT_PLACEHOLDER}'}/api/trpc/github.getIssues?input=\${encodeURIComponent(JSON.stringify({ 
        json: { 
          pageUrl, 
          githubToken: process.env.GITHUB_TOKEN, 
          githubOwner: process.env.GITHUB_OWNER, 
          githubRepo: process.env.GITHUB_REPO 
        } 
      }))}\`
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch issues', details: error },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    // Extract the actual data from tRPC response format
    const issues = result?.result?.data?.json || [];
    return NextResponse.json(issues);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
`,

  'app/api/webfeedback/issues/all/route.ts': `import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch(
      \`\${'${API_ENDPOINT_PLACEHOLDER}'}/api/trpc/github.getAllIssues?input=\${encodeURIComponent(JSON.stringify({ 
        json: { 
          githubToken: process.env.GITHUB_TOKEN, 
          githubOwner: process.env.GITHUB_OWNER, 
          githubRepo: process.env.GITHUB_REPO 
        } 
      }))}\`
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch issues', details: error },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    // Extract the actual data from tRPC response format
    const issues = result?.result?.data?.json || [];
    return NextResponse.json(issues);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
`,

  'app/api/webfeedback/issues/[id]/comments/route.ts': `import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issueNumber = parseInt(params.id);
    
    if (isNaN(issueNumber)) {
      return NextResponse.json(
        { error: 'Invalid issue number' },
        { status: 400 }
      );
    }
    
    const response = await fetch(
      \`\${'${API_ENDPOINT_PLACEHOLDER}'}/api/trpc/github.getIssueComments?input=\${encodeURIComponent(JSON.stringify({ 
        json: { 
          issueNumber, 
          githubToken: process.env.GITHUB_TOKEN, 
          githubOwner: process.env.GITHUB_OWNER, 
          githubRepo: process.env.GITHUB_REPO 
        } 
      }))}\`
    );
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: error },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    // Extract the actual data from tRPC response format
    const comments = result?.result?.data?.json || [];
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const issueNumber = parseInt(params.id);
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
    
    const response = await fetch('${API_ENDPOINT_PLACEHOLDER}/api/trpc/github.createIssueComment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          issueNumber,
          body: body.body,
          githubToken: process.env.GITHUB_TOKEN,
          githubOwner: process.env.GITHUB_OWNER,
          githubRepo: process.env.GITHUB_REPO,
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to create comment', details: error },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    return NextResponse.json(result?.result?.data?.json || result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
`,

  'app/api/webfeedback/annotations/route.ts': `import { NextResponse } from 'next/server';

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
    
    const response = await fetch('${API_ENDPOINT_PLACEHOLDER}/api/trpc/github.getAnnotationsWithComments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        json: {
          ...body,
          githubToken: process.env.GITHUB_TOKEN,
          githubOwner: process.env.GITHUB_OWNER,
          githubRepo: process.env.GITHUB_REPO,
        }
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch annotations', details: error },
        { status: response.status }
      );
    }
    
    const result = await response.json();
    // Extract the actual data from tRPC response format
    const annotations = result?.result?.data?.json || [];
    return NextResponse.json(annotations);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
`,
};

function createFile(filePath, content, apiUrl) {
  const fullPath = path.join(process.cwd(), filePath);
  const dir = path.dirname(fullPath);
  
  // Replace placeholder with actual API URL
  const finalContent = content.replace(new RegExp(API_ENDPOINT_PLACEHOLDER, 'g'), apiUrl);
  
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
  fs.writeFileSync(fullPath, finalContent, 'utf8');
  console.log(`✅ Created: ${filePath}`);
  return true;
}

function main() {
  const args = process.argv.slice(2);
  const apiUrl = args[0] || 'http://localhost:3000';
  
  console.log('\n🚀 WebFeedback Setup Script\n');
  console.log(`API Server URL: ${apiUrl}\n`);
  console.log('Generating API route files...\n');
  
  let created = 0;
  let skipped = 0;
  
  for (const [filePath, content] of Object.entries(routes)) {
    if (createFile(filePath, content, apiUrl)) {
      created++;
    } else {
      skipped++;
    }
  }
  
  console.log(`\n✨ Done! Created ${created} file(s), skipped ${skipped} existing file(s).\n`);
  console.log('Next steps:');
  console.log('1. Set environment variables in .env.local:');
  console.log('   GITHUB_TOKEN=your_token');
  console.log('   GITHUB_OWNER=your_username');
  console.log('   GITHUB_REPO=your_repo');
  console.log('2. Update the API server URL in the generated files if needed');
  console.log('3. Initialize the widget in your app:\n');
  console.log('   import { FloatingWidget, init } from "webfeedback";');
  console.log('   init({ apiEndpoint: "/api/webfeedback" });');
  console.log('   <FloatingWidget />\n');
}

if (require.main === module) {
  main();
}

module.exports = { createFile, routes };

