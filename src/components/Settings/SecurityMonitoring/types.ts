
export interface RateLimitInfo {
  allowed: boolean;
  remaining: number;
  resetTime: number;
}

export interface RateLimitStatus {
  general?: RateLimitInfo;
  login?: RateLimitInfo;
  createUser?: RateLimitInfo;
}
