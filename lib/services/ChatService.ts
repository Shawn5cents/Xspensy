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
 * Chat Service class
 * Handles AI chat interactions and financial operations
 */
class ChatService {
  private messages: ChatMessage[] = [];
  private readonly chatHistoryLimit: number;

  constructor(
    private readonly mercuryConfig: MercuryConfig,
    private readonly financialSummary: () => FinancialSummary,
    private readonly addTransaction: (type: 'income' | 'expense', amount: number, description: string) => Promise<Transaction>
  ) {
    this.chatHistoryLimit = 50; // Default limit
  }

  /**
   * Process a user message and generate a response
   */
  async processMessage(message: string): Promise<ChatResponse> {
    try {
      // Add user message to history
      this.addMessage('user', message);

      // Prepare context for AI
      const context = {
        ...this.financialSummary(),
        date: new Date().toLocaleDateString()
      };

      // Call AI service with context
      const response = await this.callAIService(message, context);

      // Process the response
      const processedResponse = await this.processAIResponse(response);

      // Add AI response to history
      this.addMessage('assistant', processedResponse.content);

      return processedResponse;
    } catch (error) {
      console.error('Error processing message:', error);
      return {
        type: 'text',
        content: 'Sorry, I encountered an error processing your request. Please try again.'
      };
    }
  }

  /**
   * Call the AI service with context
   */
  private async callAIService(message: string, context: Record<string, unknown>): Promise<string> {
    const response = await fetch(this.mercuryConfig.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.mercuryConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: this.mercuryConfig.model,
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
        max_tokens: this.mercuryConfig.tokenLimits.maxOutputTokens
      })
    });

    if (!response.ok) {
      throw new Error(`AI service error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  }

  /**
   * Generate system prompt with context
   */
  private generateSystemPrompt(context: Record<string, unknown>): string {
    return `
You are an AI financial assistant named Finance Genius. Your role is to help users with financial tracking and advice.

Current financial data:
- Balance: ${context.balance || 'Unknown'}
- Monthly Income: ${context.monthlyIncome || 'Unknown'}
- Monthly Expenses: ${context.monthlyExpenses || 'Unknown'}
- Today's date: ${context.date || new Date().toLocaleDateString()}

If the message mentions an expense:
1. Extract the amount (number)
2. Extract what it was spent on
3. Respond in a helpful way and include the new balance

If the message mentions income:
1. Extract the amount (number)
2. Extract where it came from
3. Respond in a helpful way and include the new balance

If the user asks you to modify the app, create a feature, or change something about the app:
1. Identify what feature they want to add or modify
2. Generate a JSON response in the format:
{
  "type": "appModification",
  "content": "Your friendly response explaining what will be done",
  "modification": {
    "type": "newFeature|updateFeature|fixIssue",
    "featureName": "name of the feature",
    "description": "detailed description of what should be implemented"
  }
}

For regular financial questions, respond naturally as a helpful financial assistant.
Keep responses concise but friendly.`;
  }

  /**
   * Process the AI response
   */
  private async processAIResponse(response: string): Promise<ChatResponse> {
    try {
      // Check if response is JSON
      if (response.trim().startsWith('{')) {
        const jsonResponse = JSON.parse(response);
        if (jsonResponse.type === 'appModification') {
          return jsonResponse as ChatResponse;
        }
      }

      // Process potential transaction
      const transaction = await this.extractTransaction(response);
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
      console.error('Error processing AI response:', error);
      return {
        type: 'text',
        content: response
      };
    }
  }

  /**
   * Extract transaction details from message
   */
  private async extractTransaction(message: string): Promise<{ type: 'income' | 'expense', amount: number, description: string } | null> {
    // Simple regex-based extraction
    const expenseMatch = message.match(/spent\s+\$?(\d+(?:\.\d{2})?)\s+on\s+(.+?)(?:\.|$)/i);
    if (expenseMatch) {
      return {
        type: 'expense',
        amount: parseFloat(expenseMatch[1]),
        description: expenseMatch[2].trim()
      };
    }

    const incomeMatch = message.match(/received\s+\$?(\d+(?:\.\d{2})?)\s+from\s+(.+?)(?:\.|$)/i);
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
   * Add a message to chat history
   */
  private addMessage(role: 'user' | 'assistant', content: string): void {
    this.messages.push({
      role,
      content,
      timestamp: new Date()
    });

    // Maintain history limit
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