interface StatCardProps {
  title: string;
  value: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export default function StatCard({ title, value, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-title">{title}</div>
      <div className="stat-value">{value}</div>
      {trend && (
        <div className={`trend ${trend.isPositive ? 'trend-up' : 'trend-down'}`}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d={
                trend.isPositive
                  ? "M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                  : "M19.5 13.5L12 21m0 0l-7.5-7.5M12 21V3"
              }
            />
          </svg>
          <span>{`${trend.value}%`}</span>
        </div>
      )}
    </div>
  );
}