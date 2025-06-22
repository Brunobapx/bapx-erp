
import { checkRateLimit, generalRateLimit } from '@/lib/rateLimiting';
import { auditSecurityEvent } from '@/lib/auditLogging';

export const checkUserOperationRateLimit = (currentUserId: string, operation: string) => {
  const rateLimitCheck = checkRateLimit(generalRateLimit, currentUserId);
  
  if (!rateLimitCheck.allowed) {
    auditSecurityEvent(
      'rate_limit_exceeded',
      { operation, userId: currentUserId },
      undefined,
      navigator.userAgent,
      false,
      `Rate limit exceeded for ${operation}`
    );
    
    throw new Error('Muitas tentativas. Tente novamente mais tarde.');
  }
  
  return rateLimitCheck;
};
