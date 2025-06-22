
interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

class RateLimit {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(identifier: string): boolean {
    const now = Date.now();
    const record = this.store[identifier];

    if (!record || now > record.resetTime) {
      this.store[identifier] = {
        count: 1,
        resetTime: now + this.windowMs
      };
      return true;
    }

    if (record.count >= this.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  }

  getRemainingRequests(identifier: string): number {
    const record = this.store[identifier];
    if (!record || Date.now() > record.resetTime) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - record.count);
  }

  getResetTime(identifier: string): number {
    const record = this.store[identifier];
    if (!record || Date.now() > record.resetTime) {
      return Date.now() + this.windowMs;
    }
    return record.resetTime;
  }

  cleanup(): void {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) {
        delete this.store[key];
      }
    });
  }
}

// Rate limiters para diferentes operações
export const loginRateLimit = new RateLimit(15 * 60 * 1000, 5); // 5 tentativas por 15 min
export const generalRateLimit = new RateLimit(60 * 1000, 60); // 60 requests por minuto
export const createUserRateLimit = new RateLimit(60 * 60 * 1000, 10); // 10 criações por hora

// Função utilitária para verificar rate limiting
export const checkRateLimit = (
  rateLimiter: RateLimit, 
  identifier: string
): { allowed: boolean; remaining: number; resetTime: number } => {
  const allowed = rateLimiter.isAllowed(identifier);
  const remaining = rateLimiter.getRemainingRequests(identifier);
  const resetTime = rateLimiter.getResetTime(identifier);

  return { allowed, remaining, resetTime };
};

// Cleanup automático a cada hora
setInterval(() => {
  loginRateLimit.cleanup();
  generalRateLimit.cleanup();
  createUserRateLimit.cleanup();
}, 60 * 60 * 1000);
