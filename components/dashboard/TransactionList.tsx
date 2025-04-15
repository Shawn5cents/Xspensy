import { Transaction } from '@/models/types';

interface TransactionListProps {
  transactions: Transaction[];
}

export default function TransactionList({ transactions }: TransactionListProps) {
  return (
    <div className="transactions">
      <h2 className="text-lg font-semibold mb-4">Recent Transactions</h2>
      <div className="transaction-list">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-item">
            <div className={`transaction-icon ${transaction.type}`}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={
                    transaction.type === 'income'
                      ? "M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75"
                      : "M12 4.5v15m0 0l6.75-6.75M12 19.5l-6.75-6.75"
                  }
                />
              </svg>
            </div>
            <div className="transaction-details">
              <div className="transaction-title">
                {transaction.description}
              </div>
              <div className="transaction-date">
                {transaction.date.toLocaleDateString()}
              </div>
            </div>
            <div className={`transaction-amount amount-${transaction.type}`}>
              {new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD'
              }).format(transaction.amount)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}