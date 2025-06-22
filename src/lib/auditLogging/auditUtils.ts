
import { auditLogger } from './index';

// Funções utilitárias para diferentes tipos de audit
export const auditUserAction = (
  action: string,
  userId: string,
  userEmail: string,
  details: Record<string, any>,
  success: boolean = true,
  errorMessage?: string
) => {
  auditLogger.log({
    userId,
    userEmail,
    action,
    resource: 'user',
    details,
    success,
    errorMessage
  });
};

export const auditSystemAction = (
  action: string,
  resource: string,
  details: Record<string, any>,
  success: boolean = true,
  errorMessage?: string
) => {
  auditLogger.log({
    action,
    resource,
    details,
    success,
    errorMessage
  });
};

export const auditSecurityEvent = (
  action: string,
  details: Record<string, any>,
  ipAddress?: string,
  userAgent?: string,
  success: boolean = true,
  errorMessage?: string
) => {
  auditLogger.log({
    action,
    resource: 'security',
    details,
    ipAddress,
    userAgent,
    success,
    errorMessage
  });
};
