
import { auditLogger } from '@/lib/auditLogging';

export const logUserAction = async (action: string, details: Record<string, any>) => {
  auditLogger.log({
    action,
    resource: 'user',
    details,
    success: true
  });
};
