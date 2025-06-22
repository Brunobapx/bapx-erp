
import { AuditLogger } from './AuditLogger';

export const auditLogger = new AuditLogger();

// Re-export types and utilities
export type { AuditLogEntry, AuditLogFilter, AuditStatistics } from './types';
export { auditUserAction, auditSystemAction, auditSecurityEvent } from './auditUtils';
