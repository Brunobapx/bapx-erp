
import { AuditLogEntry, AuditLogFilter, AuditStatistics } from './types';

export class AuditLogger {
  private logs: AuditLogEntry[] = [];
  private maxLogs: number = 10000;

  private generateId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    const auditEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      ...entry
    };

    this.logs.push(auditEntry);

    // Manter apenas os logs mais recentes
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Log no console para desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      console.log('[AUDIT]', auditEntry);
    }

    // Em produção, você enviaria para um serviço de logging
    this.sendToExternalService(auditEntry);
  }

  private async sendToExternalService(entry: AuditLogEntry): Promise<void> {
    // Aqui você implementaria o envio para um serviço externo
    // Por exemplo: Supabase, AWS CloudWatch, Datadog, etc.
    try {
      // Exemplo com Supabase (descomente quando necessário)
      // await supabase.from('audit_logs').insert(entry);
    } catch (error) {
      console.error('[AUDIT] Falha ao enviar log para serviço externo:', error);
    }
  }

  getLogs(filter?: AuditLogFilter): AuditLogEntry[] {
    let filteredLogs = [...this.logs];

    if (filter?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filter.userId);
    }

    if (filter?.action) {
      filteredLogs = filteredLogs.filter(log => log.action === filter.action);
    }

    if (filter?.resource) {
      filteredLogs = filteredLogs.filter(log => log.resource === filter.resource);
    }

    if (filter?.success !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.success === filter.success);
    }

    if (filter?.startDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) >= filter.startDate!
      );
    }

    if (filter?.endDate) {
      filteredLogs = filteredLogs.filter(log => 
        new Date(log.timestamp) <= filter.endDate!
      );
    }

    return filteredLogs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  clearLogs(): void {
    this.logs = [];
  }

  getStatistics(): AuditStatistics {
    const totalLogs = this.logs.length;
    const successfulLogs = this.logs.filter(log => log.success).length;
    const successRate = totalLogs > 0 ? (successfulLogs / totalLogs) * 100 : 0;

    // Contar ações mais comuns
    const actionCounts: Record<string, number> = {};
    const userCounts: Record<string, number> = {};

    this.logs.forEach(log => {
      actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      if (log.userId) {
        userCounts[log.userId] = (userCounts[log.userId] || 0) + 1;
      }
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const topUsers = Object.entries(userCounts)
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalLogs,
      successRate,
      topActions,
      topUsers
    };
  }
}
