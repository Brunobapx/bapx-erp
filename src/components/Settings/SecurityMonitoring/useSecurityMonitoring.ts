
import { useState, useEffect } from 'react';
import { auditLogger } from '@/lib/auditLogging';
import { checkRateLimit, generalRateLimit, loginRateLimit, createUserRateLimit } from '@/lib/rateLimiting';
import { useAuth } from '@/components/Auth/AuthProvider';
import { RateLimitStatus } from './types';
import { AuditLogEntry, AuditStatistics } from '@/lib/auditLogging';

export const useSecurityMonitoring = () => {
  const { user } = useAuth();
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [statistics, setStatistics] = useState<AuditStatistics | null>(null);
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

  return {
    auditLogs,
    statistics,
    rateLimitStatus,
    loadData
  };
};
