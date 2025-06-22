
import React from 'react';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, RefreshCw } from "lucide-react";
import { useSecurityMonitoring } from './SecurityMonitoring/useSecurityMonitoring';
import { SecurityOverviewCards } from './SecurityMonitoring/SecurityOverviewCards';
import { TopActionsCard } from './SecurityMonitoring/TopActionsCard';
import { AuditLogsList } from './SecurityMonitoring/AuditLogsList';
import { RateLimitCards } from './SecurityMonitoring/RateLimitCards';
import { SecurityEventsList } from './SecurityMonitoring/SecurityEventsList';

export const SecurityMonitoring = () => {
  const { auditLogs, statistics, rateLimitStatus, loadData } = useSecurityMonitoring();

  const suspiciousEventsCount = auditLogs.filter(log => !log.success).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5" />
          <h3 className="text-lg font-semibold">Monitoramento de Segurança</h3>
        </div>
        <Button onClick={loadData} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="audit">Logs de Auditoria</TabsTrigger>
          <TabsTrigger value="rate-limits">Rate Limiting</TabsTrigger>
          <TabsTrigger value="security-events">Eventos de Segurança</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <SecurityOverviewCards 
            statistics={statistics} 
            suspiciousEventsCount={suspiciousEventsCount} 
          />
          <TopActionsCard statistics={statistics} />
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <AuditLogsList auditLogs={auditLogs} />
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <RateLimitCards rateLimitStatus={rateLimitStatus} />
        </TabsContent>

        <TabsContent value="security-events" className="space-y-4">
          <SecurityEventsList auditLogs={auditLogs} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
