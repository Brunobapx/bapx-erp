
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AuditStatistics } from '@/lib/auditLogging';

interface TopActionsCardProps {
  statistics: AuditStatistics | null;
}

export const TopActionsCard: React.FC<TopActionsCardProps> = ({ statistics }) => {
  if (!statistics || statistics.topActions.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Mais Frequentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {statistics.topActions.slice(0, 5).map((action, index) => (
            <div key={index} className="flex justify-between items-center">
              <span className="text-sm">{action.action}</span>
              <Badge variant="secondary">{action.count}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
