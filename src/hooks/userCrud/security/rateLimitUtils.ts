
import { checkRateLimit as checkRateLimitLib, generalRateLimit } from '@/lib/rateLimiting';
import { auditSecurityEvent } from '@/lib/auditLogging';

export const checkRateLimit = async (operation: string): Promise<boolean> => {
  const currentUserId = 'anonymous'; // In a real app, get from auth context
  const rateLimitCheck = checkRateLimitLib(generalRateLimit, currentUserId);
  
  if (!rateLimitCheck.allowed) {
    auditSecurityEvent(
      'rate_limit_exceeded',
      { operation, userId: currentUserId },
      undefined,
      navigator.userAgent,
      false,
      `Rate limit exceeded for ${operation}`
    );
    
    return false;
  }
  
  return true;
};
