import { NextResponse } from 'next/server';
import { database } from '@/src/database';
import { widgetCustomers } from '@/src/database/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { isDomainAllowed, extractOriginFromHeaders } from '@/lib/widget/domain-validation';
import { getCorsHeaders } from '@/lib/widget/cors';

export async function GET(request: Request) {
  try {
    const requestOrigin = extractOriginFromHeaders(request.headers);
    const { searchParams } = new URL(request.url);
    const apiKey = searchParams.get('key');

    if (!apiKey) {
      return NextResponse.json(
        { error: 'API key is required' },
        { 
          status: 400,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('wf_')) {
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { 
          status: 400,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }

    // Look up customer by API key
    const [customer] = await database
      .select()
      .from(widgetCustomers)
      .where(
        and(
          eq(widgetCustomers.apiKey, apiKey),
          eq(widgetCustomers.isActive, true)
        )
      )
      .limit(1);

    if (!customer) {
      return NextResponse.json(
        { error: 'Invalid or inactive API key' },
        { 
          status: 401,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }

    // Validate domain whitelist
    if (!isDomainAllowed(requestOrigin, customer.allowedDomains)) {
      // Log unauthorized access attempt (could add logging here)
      return NextResponse.json(
        { error: 'Domain not authorized' },
        { 
          status: 403,
          headers: getCorsHeaders(requestOrigin)
        }
      );
    }

    // Get the base URL for API endpoint (use NEXT_PUBLIC_URL or extract from request URL)
    // The request URL itself tells us where the webfeedback server is
    const requestUrl = new URL(request.url);
    const baseUrl = process.env.NEXT_PUBLIC_URL || 
      `${requestUrl.protocol}//${requestUrl.host}`;

    // Return configuration (excluding sensitive GitHub credentials)
    // apiEndpoint must be a full URL pointing back to webfeedback server
    return NextResponse.json({
      apiEndpoint: `${baseUrl}/api/webfeedback`,
      name: customer.name,
      config: customer.config || {},
    }, {
      headers: getCorsHeaders(requestOrigin)
    });
  } catch (error) {
    console.error('Error fetching widget config:', error);
    const requestOrigin = extractOriginFromHeaders(request.headers);
    return NextResponse.json(
      { error: 'Internal server error' },
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

