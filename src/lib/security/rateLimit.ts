
// Enhanced rate limiting with better security
export class EnhancedRateLimit {
  private static instances = new Map<string, EnhancedRateLimit>();
  private requests = new Map<string, { count: number; resetTime: number; blocked: boolean }>();
  
  constructor(
    private windowMs: number = 15 * 60 * 1000, // 15 minutes
    private maxRequests: number = 100,
    private blockDuration: number = 60 * 1000 // 1 minute block after limit exceeded
  ) {}
  
  static getInstance(key: string, windowMs?: number, maxRequests?: number): EnhancedRateLimit {
    if (!this.instances.has(key)) {
      this.instances.set(key, new EnhancedRateLimit(windowMs, maxRequests));
    }
    return this.instances.get(key)!;
  }
  
  isAllowed(identifier: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(identifier);
    
    // Check if currently blocked
    if (record?.blocked && now < record.resetTime) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }
    
    // Reset if window expired or unblock
    if (!record || now > record.resetTime) {
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs,
        blocked: false
      });
      return { allowed: true, remaining: this.maxRequests - 1, resetTime: now + this.windowMs };
    }
    
    // Check if limit exceeded
    if (record.count >= this.maxRequests) {
      // Block for additional time
      record.blocked = true;
      record.resetTime = now + this.blockDuration;
      
      console.warn(`[RateLimit] Identifier ${identifier} exceeded rate limit and is blocked`);
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }
    
    // Increment count
    record.count++;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }
  
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }
  
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime && !record.blocked) {
        this.requests.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters
export const loginRateLimit = EnhancedRateLimit.getInstance('login', 15 * 60 * 1000, 5);
export const apiRateLimit = EnhancedRateLimit.getInstance('api', 60 * 1000, 60);
export const searchRateLimit = EnhancedRateLimit.getInstance('search', 60 * 1000, 30);

// Cleanup interval
setInterval(() => {
  loginRateLimit.cleanup();
  apiRateLimit.cleanup();
  searchRateLimit.cleanup();
}, 5 * 60 * 1000); // Clean every 5 minutes
