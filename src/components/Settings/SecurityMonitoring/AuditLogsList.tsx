
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, AlertTriangle } from "lucide-react";
import { AuditLogEntry } from '@/lib/auditLogging';

interface AuditLogsListProps {
  auditLogs: AuditLogEntry[];
}

export const AuditLogsList: React.FC<AuditLogsListProps> = ({ auditLogs }) => {
  const getLogTypeColor = (action: string) => {
    if (action.includes('failed') || action.includes('violation') || action.includes('attempt')) {
      return 'destructive';
    }
    if (action.includes('success')) {
      return 'default';
    }
    return 'secondary';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Auditoria Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {auditLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant={getLogTypeColor(log.action)}>
                    {log.action}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  <span className="font-medium">{log.resource}</span>
                  {log.userEmail && (
                    <span className="ml-2 text-muted-foreground">
                      por {log.userEmail}
                    </span>
                  )}
                </div>
                {log.errorMessage && (
                  <div className="text-sm text-red-600 mt-1">
                    {log.errorMessage}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {log.success ? (
                  <Shield className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                )}
              </div>
            </div>
          ))}
          {auditLogs.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              Nenhum log encontrado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
