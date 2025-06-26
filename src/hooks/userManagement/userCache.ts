
import { UnifiedUser, UserCache } from './types';

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, UserCache>();

export const userCacheUtils = {
  getCacheKey: (companyId: string) => `users_${companyId}`,

  loadFromCache: (companyId: string): UnifiedUser[] | null => {
    const cacheKey = userCacheUtils.getCacheKey(companyId);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('[UnifiedUserManagement] Loading from cache');
      return cached.data;
    }
    
    return null;
  },

  saveToCache: (companyId: string, data: UnifiedUser[]) => {
    const cacheKey = userCacheUtils.getCacheKey(companyId);
    cache.set(cacheKey, { data, timestamp: Date.now() });
  },

  invalidateCache: (companyId: string) => {
    const cacheKey = userCacheUtils.getCacheKey(companyId);
    cache.delete(cacheKey);
  }
};
