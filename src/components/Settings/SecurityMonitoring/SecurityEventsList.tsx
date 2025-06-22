
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { AuditLogEntry } from '@/lib/auditLogging';

interface SecurityEventsListProps {
  auditLogs: AuditLogEntry[];
}

export const SecurityEventsList: React.FC<SecurityEventsListProps> = ({ auditLogs }) => {
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const suspiciousLogs = auditLogs.filter(log => 
    !log.success || log.action.includes('violation') || log.action.includes('attempt')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos de Segurança Suspeitos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {suspiciousLogs.map((log) => (
            <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg border-red-200 bg-red-50">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Badge variant="destructive">
                    {log.action}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatTimestamp(log.timestamp)}
                  </span>
                </div>
                <div className="text-sm mt-1">
                  {log.errorMessage || JSON.stringify(log.details)}
                </div>
                {log.ipAddress && (
                  <div className="text-xs text-muted-foreground mt-1">
                    IP: {log.ipAddress}
                  </div>
                )}
              </div>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </div>
          ))}
          {suspiciousLogs.length === 0 && (
            <div className="text-center text-muted-foreground py-4">
              Nenhum evento suspeito detectado
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
