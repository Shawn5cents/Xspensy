# ChatService Component

## Overview
ChatService handles AI-powered chat interactions with optimized token usage for the Deepseek API integration.

## Features
- Token-efficient message processing
- Transaction extraction from chat
- Financial context integration
- Message history management

## Technical Details
- Uses Deepseek Chat API
- Implements async/await pattern
- Token optimization techniques:
  - Reduced context size
  - Minimized system prompts
  - Limited chat history (10 messages)
  - Efficient message parsing

## Changes Implemented
**Type**: Medium (Feature implementation)
- Converted to use Deepseek API
- Optimized token usage
- Added database integration via Prisma
- Improved error handling

## Dependencies
- ConfigService: For API configuration
- FinancialService: For transaction management
- Prisma: For database operations

## Usage
```typescript
const chatService = new ChatService(
  configService.getMercuryConfig(),
  async () => await financialService.getSummary(),
  async (type, amount, description) => {
    const result = await financialService.addTransaction(type, amount, description);
    return result.transaction;
  }
);
```

## Next Steps
1. Add proper error retry mechanism
2. Implement rate limiting
3. Add message caching
4. Set up unit tests