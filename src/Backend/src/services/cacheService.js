class CacheService {
  constructor(ttl = 3600) { // Default TTL is 1 hour
    this.cache = new Map();
    this.ttl = ttl * 1000; // convert to ms
  }

  set(key, value) {
    const expiresAt = Date.now() + this.ttl;
    this.cache.set(key, { value, expiresAt });
  }

  get(key) {
    const cachedItem = this.cache.get(key);
    
    if (!cachedItem) return null;

    if (Date.now() > cachedItem.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return cachedItem.value;
  }

  clear() {
    this.cache.clear();
  }
}

// Export a singleton instance
export const cacheService = new CacheService();
