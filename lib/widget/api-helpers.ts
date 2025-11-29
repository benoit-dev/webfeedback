import { database } from '@/src/database';
import { widgetCustomers } from '@/src/database/drizzle/schema';
import { eq, and } from 'drizzle-orm';
import { isDomainAllowed, extractOriginFromHeaders } from './domain-validation';

/**
 * Get GitHub config from API key in request
 * Validates domain whitelist and returns customer's GitHub credentials
 */
export async function getGitHubConfigFromRequest(request: Request): Promise<{
  token: string;
  owner: string;
  repo: string;
  customerId: string;
}> {
  // Extract API key from query params or headers
  const { searchParams } = new URL(request.url);
  const apiKeyFromQuery = searchParams.get('key');
  const apiKeyFromHeader = request.headers.get('x-api-key') || request.headers.get('X-API-Key');
  const apiKey = apiKeyFromQuery || apiKeyFromHeader;

  if (!apiKey) {
    console.error('API key missing. Query params:', Object.fromEntries(searchParams), 'Headers:', {
      'x-api-key': request.headers.get('x-api-key'),
      'X-API-Key': request.headers.get('X-API-Key'),
    });
    throw new Error('API key is required. Provide ?key=wf_... in URL or X-API-Key header.');
  }

  if (!apiKey.startsWith('wf_')) {
    throw new Error('Invalid API key format');
  }

  // Look up customer
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
    throw new Error('Invalid or inactive API key');
  }

  // Validate domain whitelist
  const requestOrigin = extractOriginFromHeaders(request.headers);
  if (!isDomainAllowed(requestOrigin, customer.allowedDomains)) {
    throw new Error('Domain not authorized');
  }

  return {
    token: customer.githubToken,
    owner: customer.githubOwner,
    repo: customer.githubRepo,
    customerId: customer.id,
  };
}

