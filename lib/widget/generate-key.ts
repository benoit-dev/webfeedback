import { createId } from '@paralleldrive/cuid2';

/**
 * Generate a unique API key with the format wf_<random>
 */
export function generateApiKey(): string {
  return `wf_${createId()}`;
}

/**
 * Validate API key format
 */
export function isValidApiKey(key: string): boolean {
  return /^wf_[a-z0-9]+$/.test(key);
}

