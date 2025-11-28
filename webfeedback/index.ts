export { FloatingWidget } from './components/FloatingWidget';
export { setupConfig, getConfigFromEnv } from './lib/config';
export type { GitHubConfig, Annotation, AnnotationWithComments } from './types';
import { setupConfig } from './lib/config';

/**
 * Initialize WebFeedback widget with API endpoint configuration
 * @param options Configuration options
 * @param options.apiEndpoint The API endpoint URL (defaults to '/api/webfeedback')
 */
export function init(options: { apiEndpoint?: string } = {}) {
  setupConfig({ apiEndpoint: options.apiEndpoint || '/api/webfeedback' });
}

