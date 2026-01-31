import React from 'react';
import { Card } from '@/components/Card';

export interface StatsCardProps {
  value: string | number;
  label: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  value,
  label,
  color = 'primary',
  className = ''
}) => {
  const colorClasses = {
    primary: 'text-primary-600 dark:text-primary-400',
    secondary: 'text-secondary-600 dark:text-secondary-400',
    success: 'text-success-600 dark:text-success-400',
    warning: 'text-warning-600 dark:text-warning-400',
    error: 'text-error-600 dark:text-error-400'
  };

  return (
    <Card variant="stats" className={className}>
      <div className={`stats-number ${colorClasses[color]}`}>
        {value}
      </div>
      <div className="stats-label">
        {label}
      </div>
    </Card>
  );
};



