import type { Transaction, TransactionRequest } from '@/models/types';

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

interface ChatRequest {
  message: string;
}

interface ChatResponse {
  type: 'text' | 'appModification';
  content: string;
  modification?: {
    type: 'newFeature' | 'updateFeature' | 'fixIssue';
    featureName: string;
    description: string;
  };
}

/**
 * API Client for interacting with the backend
 */
class APIClient {
  private static async fetchJSON<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const response = await fetch(`/api/${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'An error occurred');
    }

    return data;
  }

  /**
   * Get recent transactions
   */
  static async getTransactions(limit?: number): Promise<Transaction[]> {
    const url = limit ? `transactions?limit=${limit}` : 'transactions';
    const response = await this.fetchJSON<Transaction[]>(url);
    return response.data || [];
  }

  /**
   * Add a new transaction
   */
  static async addTransaction(transaction: TransactionRequest): Promise<Transaction> {
    const response = await this.fetchJSON<{ transaction: Transaction }>('transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
    return response.data!.transaction;
  }

  /**
   * Send a chat message
   */
  static async sendChatMessage(message: string): Promise<ChatResponse> {
    const response = await this.fetchJSON<ChatResponse>('chat', {
      method: 'POST',
      body: JSON.stringify({ message } as ChatRequest),
    });
    return response.data!;
  }

  /**
   * Get chat history
   */
  static async getChatHistory(): Promise<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }[]> {
    const response = await this.fetchJSON<{
      role: 'user' | 'assistant';
      content: string;
      timestamp: Date;
    }[]>('chat');
    return response.data || [];
  }

  /**
   * Verify API key
   */
  static async verifyApiKey(apiKey: string): Promise<boolean> {
    try {
      await this.fetchJSON('verify-key', {
        method: 'POST',
        body: JSON.stringify({ apiKey }),
      });
      return true;
    } catch {
      return false;
    }
  }
}

export default APIClient;