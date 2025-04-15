import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import FinancialService from '@/lib/services/FinancialService';
import type { TransactionRequest } from '@/models/types';

const financialService = new FinancialService();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    
    const transactions = financialService.getTransactions(limit ? parseInt(limit) : undefined);
    
    return NextResponse.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TransactionRequest = await request.json();
    
    if (!body.type || !body.amount || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let result;
    if (body.type === 'expense') {
      result = financialService.addExpense(body.amount, body.description);
    } else if (body.type === 'income') {
      result = financialService.addIncome(body.amount, body.description);
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid transaction type' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error adding transaction:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add transaction' },
      { status: 500 }
    );
  }
}