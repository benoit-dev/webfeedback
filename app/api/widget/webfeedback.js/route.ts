import { NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { extractOriginFromHeaders } from '@/lib/widget/domain-validation';
import { getCorsHeaders } from '@/lib/widget/cors';

export async function GET(request: Request) {
  try {
    const requestOrigin = extractOriginFromHeaders(request.headers);
    
    // Serve the pre-built bundle from public/widget/v1/webfeedback.js
    const bundlePath = join(process.cwd(), 'public', 'widget', 'v1', 'webfeedback.js');
    
    if (!existsSync(bundlePath)) {
      console.error('Widget bundle not found. Run: pnpm build:widget');
      return NextResponse.json(
        { error: 'Widget bundle not found. Please build it first.' },
        { 
          status: 500,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    const bundleContent = readFileSync(bundlePath, 'utf-8');
    
    // Log first 100 chars for debugging (only in development)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Bundle preview (first 100 chars):', bundleContent.substring(0, 100));
    }
    
    // Validate bundle: must contain IIFE pattern
    const expectedPattern = 'var WebFeedback = (() => {';
    const hasBanner = bundleContent.trim().startsWith('/* WebFeedback Widget Bundle */');
    const hasIIFE = bundleContent.includes(expectedPattern);
    
    if (!hasBanner && !hasIIFE) {
      console.error('Invalid bundle: does not contain expected IIFE pattern');
      console.error('Bundle starts with:', bundleContent.substring(0, 200));
      return NextResponse.json(
        { error: 'Invalid bundle format' },
        { 
          status: 500,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    // Validate bundle: must NOT contain ES module import statements
    const importStatementRegex = /^\s*import\s+(?:\{[^}]*\}|\*|[\w$]+)\s+from\s+['"]/m;
    if (importStatementRegex.test(bundleContent)) {
      console.error('Invalid bundle: contains ES module import statements');
      const importLines = bundleContent.split('\n')
        .map((line, idx) => ({ line, idx: idx + 1 }))
        .filter(({ line }) => /^\s*import\s+(?:\{|[\w$]+|\*)\s+from/.test(line));
      console.error('Found import statements at lines:', importLines.map(({ idx }) => idx).join(', '));
      return NextResponse.json(
        { error: 'Invalid bundle: contains ES module imports' },
        { 
          status: 500,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }
    
    // Set cache headers based on environment
    const isProduction = process.env.NODE_ENV === 'production';
    const cacheControl = isProduction 
      ? 'public, max-age=31536000, immutable'
      : 'no-cache, no-store, must-revalidate';
    
    return new NextResponse(bundleContent, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': cacheControl,
        'X-SourceMap': 'none', // Explicitly disable source maps
        'X-Content-Type-Options': 'nosniff',
        ...getCorsHeaders(requestOrigin),
      },
    });
  } catch (error) {
    console.error('Error serving widget bundle:', error);
    const requestOrigin = extractOriginFromHeaders(request.headers);
    return NextResponse.json(
      { error: 'Failed to load widget' },
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
    headers: getCorsHeaders(null),
  });
}

