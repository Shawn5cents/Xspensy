import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import ChatService from '@/lib/services/ChatService';
import FinancialService from '@/lib/services/FinancialService';
import ConfigService from '@/lib/services/ConfigService';

// Initialize services
const configService = new ConfigService();
const financialService = new FinancialService();

// Initialize chat service with dependencies
const chatService = new ChatService(
  configService.getMercuryConfig(),
  () => financialService.getSummary(),
  async (type, amount, description) => {
    if (type === 'expense') {
      return financialService.addExpense(amount, description).transaction;
    } else {
      return financialService.addIncome(amount, description).transaction;
    }
  }
);

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Message is required' },
        { status: 400 }
      );
    }

    const response = await chatService.processMessage(message);

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process message' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const history = chatService.getChatHistory();
    
    return NextResponse.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch chat history' },
      { status: 500 }
    );
  }
}