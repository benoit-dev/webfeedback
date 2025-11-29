/**
 * Normalize a domain string for comparison
 * Removes protocol, www prefix, trailing slashes, and converts to lowercase
 */
export function normalizeDomain(domain: string): string {
  let normalized = domain.trim().toLowerCase();
  
  // Remove protocol (http://, https://)
  normalized = normalized.replace(/^https?:\/\//, '');
  
  // Remove www. prefix
  normalized = normalized.replace(/^www\./, '');
  
  // Remove trailing slashes and paths
  normalized = normalized.split('/')[0];
  
  // Remove port numbers
  normalized = normalized.split(':')[0];
  
  return normalized;
}

/**
 * Validate if a domain is in the allowed domains list
 */
export function isDomainAllowed(requestOrigin: string | null, allowedDomains: string[]): boolean {
  if (!requestOrigin) {
    return false;
  }
  
  const normalizedRequest = normalizeDomain(requestOrigin);
  
  return allowedDomains.some(domain => {
    const normalizedAllowed = normalizeDomain(domain);
    return normalizedRequest === normalizedAllowed;
  });
}

/**
 * Extract origin from request headers
 */
export function extractOriginFromHeaders(headers: Headers): string | null {
  // Try Origin header first (for CORS requests)
  const origin = headers.get('origin');
  if (origin) {
    return origin;
  }
  
  // Fall back to Referer header
  const referer = headers.get('referer');
  if (referer) {
    try {
      const url = new URL(referer);
      return url.origin;
    } catch {
      return null;
    }
  }
  
  return null;
}

