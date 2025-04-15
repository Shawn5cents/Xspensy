import { Transaction, TransactionType } from '@/models/types';

/**
 * Financial Service class
 * Responsible for managing financial data and operations
 */
class FinancialService {
  private balance: number;
  private monthlyIncome: number;
  private monthlyExpenses: number;
  private transactions: Transaction[];

  constructor() {
    // Initialize with empty state - will be loaded from database later
    this.balance = 0;
    this.monthlyIncome = 0;
    this.monthlyExpenses = 0;
    this.transactions = [];
  }

  /**
   * Get the current financial summary
   */
  getSummary() {
    const savingsRate = this.monthlyIncome > 0
      ? ((this.monthlyIncome - this.monthlyExpenses) / this.monthlyIncome) * 100
      : 0;

    return {
      balance: this.balance,
      monthlyIncome: this.monthlyIncome,
      monthlyExpenses: this.monthlyExpenses,
      savingsRate
    };
  }

  /**
   * Get the list of recent transactions
   */
  getTransactions(limit: number = 10): Transaction[] {
    return [...this.transactions]
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, limit);
  }

  /**
   * Add a new expense transaction
   */
  addExpense(amount: number, description: string): {
    transaction: Transaction;
    newBalance: number;
    newExpenses: number;
  } {
    const transaction = this.addTransaction({
      description,
      amount,
      type: 'expense' as TransactionType
    });

    return {
      transaction,
      newBalance: this.balance,
      newExpenses: this.monthlyExpenses
    };
  }

  /**
   * Add a new income transaction
   */
  addIncome(amount: number, description: string): {
    transaction: Transaction;
    newBalance: number;
    newIncome: number;
  } {
    const transaction = this.addTransaction({
      description,
      amount,
      type: 'income' as TransactionType
    });

    return {
      transaction,
      newBalance: this.balance,
      newIncome: this.monthlyIncome
    };
  }

  /**
   * Add a new transaction
   */
  private addTransaction(transaction: Omit<Transaction, 'id' | 'date'>): Transaction {
    this.validateTransaction(transaction);

    const newTransaction: Transaction = {
      id: this.generateTransactionId(),
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      date: new Date()
    };

    // Update financial summary
    if (transaction.type === 'income') {
      this.monthlyIncome += transaction.amount;
      this.balance += transaction.amount;
    } else {
      this.monthlyExpenses += transaction.amount;
      this.balance -= transaction.amount;
    }

    // Add to transactions list
    this.transactions.unshift(newTransaction);

    return newTransaction;
  }

  /**
   * Validate transaction data
   */
  private validateTransaction(transaction: Omit<Transaction, 'id' | 'date'>) {
    if (!transaction.description || transaction.amount === undefined || !transaction.type) {
      throw new Error('Invalid transaction: required fields missing');
    }

    if (transaction.type !== 'income' && transaction.type !== 'expense') {
      throw new Error('Invalid transaction type: must be "income" or "expense"');
    }

    if (isNaN(transaction.amount) || transaction.amount <= 0) {
      throw new Error('Invalid amount: must be a positive number');
    }
  }

  /**
   * Generate a unique transaction ID
   */
  private generateTransactionId(): number {
    return Math.max(0, ...this.transactions.map(t => t.id)) + 1;
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
}

export default FinancialService;