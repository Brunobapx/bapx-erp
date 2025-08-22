import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from 'lucide-react';
import { formatCurrency } from '@/utils/formatCurrency';

interface FinancialMetricsCardProps {
  title: string;
  count: number;
  value: number;
  icon: LucideIcon;
  iconColor: string;
  bgColor: string;
}

export const FinancialMetricsCard: React.FC<FinancialMetricsCardProps> = ({
  title,
  count,
  value,
  icon: Icon,
  iconColor,
  bgColor
}) => {
  // Import formatCurrency from utils

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`w-10 h-10 ${bgColor} rounded-full flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1">
          <div className="text-2xl font-bold text-card-foreground">
            {formatCurrency(value)}
          </div>
          <p className="text-xs text-muted-foreground">
            {count} {count === 1 ? 'lançamento' : 'lançamentos'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};