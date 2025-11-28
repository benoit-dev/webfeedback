export interface WebFeedbackConfig {
  apiEndpoint?: string;
}

let config: WebFeedbackConfig | null = null;

export function setupConfig(newConfig: WebFeedbackConfig) {
  config = newConfig;
}

export function getApiEndpoint(): string {
  if (!config || !config.apiEndpoint) {
    return '/api/webfeedback';
  }
  return config.apiEndpoint;
}

// Legacy functions kept for backward compatibility
// These are no longer needed but kept to avoid breaking changes
export function getConfig(): never {
    throw new Error(
    'WebFeedback no longer uses client-side GitHub configuration. Use setupConfig({ apiEndpoint }) instead.'
    );
  }

export function getConfigFromEnv(): never {
  throw new Error(
    'WebFeedback no longer uses environment variables for client-side configuration. Use setupConfig({ apiEndpoint }) instead.'
  );
}

