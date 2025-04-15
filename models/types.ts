/**
 * Transaction type definition
 */
export type TransactionType = 'income' | 'expense';

/**
 * Transaction interface
 */
export interface Transaction {
  id: number;
  description: string;
  amount: number;
  type: TransactionType;
  date: Date;
}

/**
 * Financial summary interface
 */
export interface FinancialSummary {
  balance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
}

/**
 * Transaction request interface
 */
export interface TransactionRequest {
  description: string;
  amount: number;
  type: TransactionType;
}

/**
 * Transaction response interface
 */
export interface TransactionResponse {
  transaction: Transaction;
  newBalance: number;
  newIncome?: number;
  newExpenses?: number;
}