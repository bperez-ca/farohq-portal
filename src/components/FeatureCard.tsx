import React from 'react';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { Card } from '@/components/ui/card';

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  iconColor?: string;
  className?: string;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  icon: Icon,
  title,
  description,
  iconColor = 'text-primary-600 dark:text-primary-400',
  className = ''
}) => {
  return (
    <Card className={className}>
      <div className={clsx('feature-icon bg-primary-100 dark:bg-primary-900/30', iconColor)}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </Card>
  );
};



