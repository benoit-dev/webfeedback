export interface WebFeedbackConfig {
  apiEndpoint?: string;
  apiKey?: string;
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

export function getApiKey(): string | undefined {
  return config?.apiKey;
}

// Initialize from global config (set by loader script)
export function initFromGlobalConfig() {
  if (typeof window !== 'undefined') {
    const globalConfig = (window as any).__WebFeedbackConfig;
    const globalApiKey = (window as any).__WebFeedbackApiKey;
    
    if (globalConfig || globalApiKey) {
      setupConfig({
        apiEndpoint: globalConfig?.apiEndpoint || '/api/webfeedback',
        apiKey: globalApiKey,
      });
    }
  }
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

