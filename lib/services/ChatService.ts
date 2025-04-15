import { MercuryConfig } from './ConfigService';
import type { Transaction, FinancialSummary } from '@/models/types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AppModification {
  type: 'newFeature' | 'updateFeature' | 'fixIssue';
  featureName: string;
  description: string;
}

interface ChatResponse {
  type: 'text' | 'appModification';
  content: string;
  modification?: AppModification;
}

/**
 * Optimized Chat Service for token efficiency
 */
class ChatService {
  private messages: ChatMessage[] = [];
  private readonly chatHistoryLimit: number;

  constructor(
    private readonly mercuryConfig: MercuryConfig,
    private readonly financialSummary: () => Promise<FinancialSummary>,
    private readonly addTransaction: (type: 'income' | 'expense', amount: number, description: string) => Promise<Transaction>
  ) {
    this.chatHistoryLimit = 10; // Reduced history limit for token efficiency
  }

  /**
   * Process a user message and generate a response
   */
  async processMessage(message: string): Promise<ChatResponse> {
    try {
      this.addMessage('user', message);
      const summary = await this.financialSummary();
      
      // Optimize context size
      const context = {
        b: summary.balance,
        i: summary.monthlyIncome,
        e: summary.monthlyExpenses,
        d: new Date().toLocaleDateString()
      };

      const response = await this.callDeepseekAPI(message, context);
      const processedResponse = await this.processAIResponse(response);
      this.addMessage('assistant', processedResponse.content);

      return processedResponse;
    } catch (error) {
      console.error('Error:', error);
      return {
        type: 'text',
        content: 'Error processing request.'
      };
    }
  }

  /**
   * Call Deepseek API with optimized parameters
   */
  private async callDeepseekAPI(message: string, context: Record<string, unknown>): Promise<string> {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.mercuryConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: this.generateSystemPrompt(context)
          },
          {
            role: 'user',
            content: message
          }
        ],
        max_tokens: 150,
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.2
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate minimal system prompt
   */
  private generateSystemPrompt(context: Record<string, unknown>): string {
    return `Assistant with: B:$${context.b} I:$${context.i} E:$${context.e}. For expenses/income extract amount & description. Keep responses concise.`;
  }

  /**
   * Extract transaction details from message
   */
  private extractTransaction(message: string): { type: 'income' | 'expense', amount: number, description: string } | null {
    const expenseMatch = message.match(/(\d+(?:\.\d{2})?)\s+(?:on|for)\s+(.+?)(?:\.|$)/i);
    if (expenseMatch) {
      return {
        type: 'expense',
        amount: parseFloat(expenseMatch[1]),
        description: expenseMatch[2].trim()
      };
    }

    const incomeMatch = message.match(/(\d+(?:\.\d{2})?)\s+from\s+(.+?)(?:\.|$)/i);
    if (incomeMatch) {
      return {
        type: 'income',
        amount: parseFloat(incomeMatch[1]),
        description: incomeMatch[2].trim()
      };
    }

    return null;
  }

  /**
   * Process the AI response efficiently
   */
  private async processAIResponse(response: string): Promise<ChatResponse> {
    try {
      // Check for JSON response (app modifications)
      if (response.startsWith('{')) {
        const parsed = JSON.parse(response);
        if (parsed.type === 'appModification') {
          return parsed;
        }
      }

      // Process potential transaction
      const transaction = this.extractTransaction(response);
      if (transaction) {
        await this.addTransaction(
          transaction.type,
          transaction.amount,
          transaction.description
        );
      }

      return {
        type: 'text',
        content: response
      };
    } catch (error) {
      console.error('Error processing response:', error);
      return {
        type: 'text',
        content: response
      };
    }
  }

  /**
   * Add message to chat history with size limit
   */
  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    // Keep only recent messages
    if (this.messages.length > this.chatHistoryLimit) {
      this.messages = this.messages.slice(-this.chatHistoryLimit);
    }
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return [...this.messages];
  }
}

export default ChatService;