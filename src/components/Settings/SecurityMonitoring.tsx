
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Shield, Activity, Eye, RefreshCw } from "lucide-react";
import { auditLogger } from '@/lib/auditLogging';
import { checkRateLimit, generalRateLimit, loginRateLimit, createUserRateLimit } from '@/lib/rateLimiting';
import { useAuth } from '@/components/Auth/AuthProvider';

interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

interface RateLimitStatus {
  general?: RateLimitInfo;
  login?: RateLimitInfo;
  createUser?: RateLimitInfo;
}

export const SecurityMonitoring = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({});

  const loadData = () => {
    // Carregar logs de auditoria
    const logs = auditLogger.getLogs();
    setAuditLogs(logs.slice(0, 100)); // Últimos 100 logs

    // Carregar estatísticas
    const stats = auditLogger.getStatistics();
    setStatistics(stats);

    // Verificar status do rate limiting
    const userId = user?.id || 'anonymous';
    setRateLimitStatus({
      general: checkRateLimit(generalRateLimit, userId),
      login: checkRateLimit(loginRateLimit, userId),
      createUser: checkRateLimit(createUserRateLimit, userId),
    });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30 segundos
    return () => clearInterval(interval);
  }, [user?.id]);

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
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total de Logs</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.totalLogs}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{statistics.successRate.toFixed(1)}%</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eventos Suspeitos</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {auditLogs.filter(log => !log.success).length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {statistics && statistics.topActions.length > 0 && (
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
          )}
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
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
        </TabsContent>

        <TabsContent value="rate-limits" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rate Limit Geral</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Requests restantes:</span>
                    <Badge variant={rateLimitStatus.general?.remaining && rateLimitStatus.general.remaining > 10 ? 'default' : 'destructive'}>
                      {rateLimitStatus.general?.remaining || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Reset: {rateLimitStatus.general?.resetTime ? 
                      new Date(rateLimitStatus.general.resetTime).toLocaleTimeString('pt-BR') : 
                      'N/A'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rate Limit Login</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Tentativas restantes:</span>
                    <Badge variant={rateLimitStatus.login?.remaining && rateLimitStatus.login.remaining > 1 ? 'default' : 'destructive'}>
                      {rateLimitStatus.login?.remaining || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Reset: {rateLimitStatus.login?.resetTime ? 
                      new Date(rateLimitStatus.login.resetTime).toLocaleTimeString('pt-BR') : 
                      'N/A'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Rate Limit Criar Usuário</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Criações restantes:</span>
                    <Badge variant={rateLimitStatus.createUser?.remaining && rateLimitStatus.createUser.remaining > 2 ? 'default' : 'destructive'}>
                      {rateLimitStatus.createUser?.remaining || 0}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Reset: {rateLimitStatus.createUser?.resetTime ? 
                      new Date(rateLimitStatus.createUser.resetTime).toLocaleTimeString('pt-BR') : 
                      'N/A'
                    }
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security-events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos de Segurança Suspeitos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {auditLogs
                  .filter(log => !log.success || log.action.includes('violation') || log.action.includes('attempt'))
                  .map((log) => (
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
                {auditLogs.filter(log => !log.success).length === 0 && (
                  <div className="text-center text-muted-foreground py-4">
                    Nenhum evento suspeito detectado
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
