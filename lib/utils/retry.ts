/**
 * Retry configuration interface
 */
interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
  maxDelayMs: number;
}

/**
 * Error type for retryable errors
 */
interface RetryableError extends Error {
  status?: number;
  name: string;
  message: string;
}

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  delayMs: 1000,
  backoffFactor: 2,
  maxDelayMs: 10000
};

/**
 * Sleep for specified milliseconds
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate delay with exponential backoff
 */
const calculateDelay = (attempt: number, config: RetryConfig): number => {
  const delay = config.delayMs * Math.pow(config.backoffFactor, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
};

/**
 * Retry function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: RetryableError | null = null;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as RetryableError;
      
      // If this was the last attempt, throw the error
      if (attempt === finalConfig.maxAttempts) {
        throw new Error(`Operation failed after ${attempt} attempts: ${lastError.message}`);
      }

      // Calculate delay for next attempt
      const delay = calculateDelay(attempt, finalConfig);
      
      // Log retry attempt
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms:`, error);
      
      // Wait before next attempt
      await sleep(delay);
    }
  }

  // This should never happen due to the throw above, but TypeScript needs it
  throw lastError;
}

/**
 * Check if error is retryable
 */
export function isRetryableError(error: RetryableError): boolean {
  // Network errors
  if (error.name === 'NetworkError' || error.name === 'FetchError') {
    return true;
  }

  // Rate limiting
  if (error.status === 429) {
    return true;
  }

  // Server errors
  if (error.status && error.status >= 500 && error.status < 600) {
    return true;
  }

  // API-specific errors that might be temporary
  if (error.message.includes('timeout') || 
      error.message.includes('temporary') ||
      error.message.includes('overloaded')) {
    return true;
  }

  return false;
}

export type { RetryConfig, RetryableError };