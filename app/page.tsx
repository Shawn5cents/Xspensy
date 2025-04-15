'use client';

import { useEffect, useState } from 'react';
import StatCard from '@/components/dashboard/StatCard';
import TransactionList from '@/components/dashboard/TransactionList';
import ChatInterface from '@/components/chat/ChatInterface';
import APIClient from '@/lib/utils/api-client';
import type { Transaction } from '@/models/types';

export default function Home() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState('$0.00');
  const [income, setIncome] = useState('$0.00');
  const [expenses, setExpenses] = useState('$0.00');
  const [savingsRate, setSavingsRate] = useState(0);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load recent transactions
      const recentTransactions = await APIClient.getTransactions(5);
      setTransactions(recentTransactions);

      // Calculate financial summary
      const monthlyIncome = recentTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const monthlyExpenses = recentTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);
      
      const currentBalance = monthlyIncome - monthlyExpenses;
      const currentSavingsRate = monthlyIncome > 0 
        ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
        : 0;

      // Format values
      setBalance(formatCurrency(currentBalance));
      setIncome(formatCurrency(monthlyIncome));
      setExpenses(formatCurrency(monthlyExpenses));
      setSavingsRate(Math.round(currentSavingsRate * 10) / 10);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  return (
    <>
      <header className="header">
        <h1 className="header-title">Dashboard</h1>
      </header>
      
      <div className="page-content">
        <div className="dashboard-panel">
          <div className="stats-row">
            <StatCard
              title="Current Balance"
              value={balance}
            />
            <StatCard
              title="Monthly Income"
              value={income}
              trend={{
                value: 5.2,
                isPositive: true
              }}
            />
            <StatCard
              title="Monthly Expenses"
              value={expenses}
              trend={{
                value: 2.1,
                isPositive: false
              }}
            />
            <StatCard
              title="Savings Rate"
              value={`${savingsRate}%`}
              trend={{
                value: savingsRate > 20 ? savingsRate - 20 : 20 - savingsRate,
                isPositive: savingsRate > 20
              }}
            />
          </div>

          <div className="chart-container">
            <div className="chart-placeholder">
              Monthly Income vs Expenses Chart
            </div>
          </div>

          <TransactionList transactions={transactions} />
        </div>

        <ChatInterface />
      </div>
    </>
  );
}
