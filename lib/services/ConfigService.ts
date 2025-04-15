/**
 * Configuration Service
 * Handles application configuration and environment settings
 */
export interface MercuryConfig {
  baseUrl: string;
  model: string;
  apiKey?: string;
  tokenLimits: {
    maxInputTokens: number;
    maxOutputTokens: number;
  };
}

export interface AppConfig {
  name: string;
  version: string;
  maxTransactionsInList: number;
  chatHistoryLimit: number;
  serverPort: number;
}

export type Config = {
  api: {
    mercury: MercuryConfig;
  };
  app: AppConfig;
} & Record<string, unknown>;

class ConfigService {
  private config: Config;

  constructor() {
    // Initialize with environment-aware configuration
    this.config = {
      api: {
        mercury: {
          baseUrl: process.env.NEXT_PUBLIC_DEEPSEEK_API_URL || "https://api.deepseek.com/v1",
          model: process.env.NEXT_PUBLIC_DEEPSEEK_MODEL || "Deepseek-reasonor",
          apiKey: process.env.DEEPSEEK_API_KEY, // Server-side only
          tokenLimits: {
            maxInputTokens: 32000,
            maxOutputTokens: 8000
          }
        }
      },
      app: {
        name: "Xspensy",
        version: "1.0.0",
        maxTransactionsInList: 5,
        chatHistoryLimit: 50,
        serverPort: parseInt(process.env.PORT || "8003")
      }
    };
  }

  /**
   * Get Mercury (Deepseek) API configuration
   */
  getMercuryConfig(): MercuryConfig {
    return this.config.api.mercury;
  }

  /**
   * Get application configuration
   */
  getAppConfig(): AppConfig {
    return this.config.app;
  }

  /**
   * Get specific configuration value
   */
  private getConfigValue(obj: Record<string, unknown>, path: string[]): unknown {
    const [first, ...rest] = path;
    if (!first) return obj;
    
    const value = obj[first];
    if (rest.length === 0) return value;
    if (value && typeof value === 'object') {
      return this.getConfigValue(value as Record<string, unknown>, rest);
    }
    return undefined;
  }

  /**
   * Set specific configuration value
   */
  private setConfigValue(obj: Record<string, unknown>, path: string[], value: unknown): void {
    const [first, ...rest] = path;
    if (!first) return;

    if (rest.length === 0) {
      obj[first] = value;
      return;
    }

    if (!obj[first] || typeof obj[first] !== 'object') {
      obj[first] = {};
    }

    this.setConfigValue(obj[first] as Record<string, unknown>, rest, value);
  }

  /**
   * Get a configuration value by path
   */
  get<T>(path: string, defaultValue: T | null = null): T | null {
    const value = this.getConfigValue(this.config, path.split('.'));
    return (value === undefined ? defaultValue : value) as T | null;
  }

  /**
   * Set a configuration value by path
   */
  set(path: string, value: unknown): void {
    this.setConfigValue(this.config, path.split('.'), value);
  }

  /**
   * Update API key
   */
  async updateApiKey(apiKey: string): Promise<boolean> {
    try {
      // Verify API key with backend
      const response = await fetch('/api/verify-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ apiKey })
      });

      if (!response.ok) {
        throw new Error('Invalid API key');
      }

      // Update configuration
      this.set('api.mercury.apiKey', apiKey);
      
      return true;
    } catch (error) {
      console.error('Error updating API key:', error);
      return false;
    }
  }
}

export default ConfigService;