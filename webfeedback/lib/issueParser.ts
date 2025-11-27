export interface ParsedIssue {
  pageUrl: string | null;
  elementSelector: string | null;
}

/**
 * Parse page URL and element selector from GitHub issue body
 */
export function parseIssueBody(body: string): ParsedIssue {
  const result: ParsedIssue = {
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

