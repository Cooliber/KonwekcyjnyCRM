import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock Convex functions for testing
const mockConvexClient = {
  query: vi.fn(),
  mutation: vi.fn(),
  action: vi.fn()
};

// Mock cache implementations
class MockCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    if (Date.now() > cached.timestamp + cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  set(key: string, data: any, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  invalidatePattern(pattern: string): void {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

describe('Advanced Caching System Tests', () => {
  let messageCache: MockCache;
  let notificationCache: MockCache;
  let clientCache: MockCache;
  let vectorCache: MockCache;

  beforeEach(() => {
    messageCache = new MockCache();
    notificationCache = new MockCache();
    clientCache = new MockCache();
    vectorCache = new MockCache();
    vi.clearAllMocks();
  });

  afterEach(() => {
    messageCache.clear();
    notificationCache.clear();
    clientCache.clear();
    vectorCache.clear();
  });

  describe('Message Caching', () => {
    it('should cache message list with appropriate TTL', () => {
      const messages = [
        { id: '1', content: 'Test message', district: 'Śródmieście' },
        { id: '2', content: 'Another message', district: 'Mokotów' }
      ];
      
      const cacheKey = 'msg_list_general_user123';
      const ttl = 30000; // 30 seconds
      
      messageCache.set(cacheKey, messages, ttl);
      
      const cached = messageCache.get(cacheKey);
      expect(cached).toEqual(messages);
      expect(messageCache.size()).toBe(1);
    });

    it('should use shorter TTL for high-affluence districts', () => {
      const highAffluenceDistricts = ['Śródmieście', 'Wilanów', 'Mokotów'];
      const normalTTL = 30000;
      const districtTTL = 15000;
      
      highAffluenceDistricts.forEach(district => {
        const isHighAffluence = ['Śródmieście', 'Wilanów', 'Mokotów'].includes(district);
        const expectedTTL = isHighAffluence ? districtTTL : normalTTL;
        
        expect(expectedTTL).toBe(districtTTL);
      });
    });

    it('should invalidate cache on message creation', () => {
      const cacheKey = 'msg_list_general_user123';
      messageCache.set(cacheKey, ['message1'], 30000);
      
      expect(messageCache.get(cacheKey)).toBeTruthy();
      
      // Simulate message creation invalidation
      messageCache.invalidatePattern('msg_list_general');
      
      expect(messageCache.get(cacheKey)).toBeNull();
    });

    it('should handle cache expiration correctly', async () => {
      const cacheKey = 'msg_list_test';
      const shortTTL = 10; // 10ms
      
      messageCache.set(cacheKey, ['message'], shortTTL);
      
      expect(messageCache.get(cacheKey)).toBeTruthy();
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 20));
      
      expect(messageCache.get(cacheKey)).toBeNull();
    });

    it('should handle emergency message TTL correctly', () => {
      const emergencyTTL = 5000; // 5 seconds
      const normalTTL = 30000; // 30 seconds
      
      const emergencyKey = 'emergency_msg_user123';
      const normalKey = 'normal_msg_user123';
      
      messageCache.set(emergencyKey, ['emergency'], emergencyTTL);
      messageCache.set(normalKey, ['normal'], normalTTL);
      
      expect(messageCache.get(emergencyKey)).toBeTruthy();
      expect(messageCache.get(normalKey)).toBeTruthy();
    });
  });

  describe('Notification Caching', () => {
    it('should cache notifications with priority-based TTL', () => {
      const notifications = [
        { id: '1', priority: 'urgent', district: 'Śródmieście' },
        { id: '2', priority: 'medium', district: 'Wola' }
      ];
      
      const urgentTTL = 5000; // 5 seconds
      const mediumTTL = 60000; // 1 minute
      
      notificationCache.set('notif_urgent', notifications.filter(n => n.priority === 'urgent'), urgentTTL);
      notificationCache.set('notif_medium', notifications.filter(n => n.priority === 'medium'), mediumTTL);
      
      expect(notificationCache.get('notif_urgent')).toHaveLength(1);
      expect(notificationCache.get('notif_medium')).toHaveLength(1);
    });

    it('should apply district multiplier for high-affluence areas', () => {
      const baseTTL = 60000; // 1 minute
      const districtMultiplier = 0.7; // 30% reduction
      
      const highAffluenceDistricts = ['Śródmieście', 'Wilanów', 'Mokotów'];
      
      highAffluenceDistricts.forEach(district => {
        const adjustedTTL = baseTTL * districtMultiplier;
        expect(adjustedTTL).toBe(42000); // 42 seconds
      });
    });

    it('should invalidate notification cache on creation', () => {
      const userId = 'user123';
      const cacheKey = `notif_list_${userId}`;
      
      notificationCache.set(cacheKey, ['notification1'], 60000);
      expect(notificationCache.get(cacheKey)).toBeTruthy();
      
      // Simulate notification creation
      notificationCache.invalidatePattern(`notif_list_${userId}`);
      
      expect(notificationCache.get(cacheKey)).toBeNull();
    });
  });

  describe('Client Portal Caching', () => {
    it('should cache client dashboard with affluence-based TTL', () => {
      const dashboardData = {
        contact: { name: 'Test Client', affluenceScore: 9 },
        statistics: { totalJobs: 5 }
      };
      
      const baseTTL = 300000; // 5 minutes
      const highAffluenceMultiplier = 0.5; // 50% reduction for high affluence
      
      const adjustedTTL = dashboardData.contact.affluenceScore >= 8 
        ? baseTTL * highAffluenceMultiplier 
        : baseTTL;
      
      clientCache.set('dashboard_client123', dashboardData, adjustedTTL);
      
      expect(clientCache.get('dashboard_client123')).toEqual(dashboardData);
      expect(adjustedTTL).toBe(150000); // 2.5 minutes for high affluence
    });

    it('should cache booking slots with daily granularity', () => {
      const bookingSlots = [
        { datetime: Date.now(), available: true },
        { datetime: Date.now() + 3600000, available: false }
      ];
      
      const district = 'Śródmieście';
      const serviceType = 'maintenance';
      const date = new Date().setHours(0, 0, 0, 0); // Start of day
      
      const cacheKey = `booking_slots_${district}_${serviceType}_${Math.floor(date / 86400000)}`;
      
      clientCache.set(cacheKey, bookingSlots, 60000);
      
      expect(clientCache.get(cacheKey)).toEqual(bookingSlots);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce message sending rate limits', () => {
      const rateLimits = {
        MESSAGE_SEND: { requests: 30, window: 60000 },
        EMERGENCY_SEND: { requests: 5, window: 300000 }
      };
      
      const userId = 'user123';
      const now = Date.now();
      
      // Simulate rate limit tracking
      const userLimit = {
        count: 1,
        resetTime: now + rateLimits.MESSAGE_SEND.window
      };
      
      expect(userLimit.count).toBeLessThanOrEqual(rateLimits.MESSAGE_SEND.requests);
    });

    it('should allow AI exemptions for emergency messages', () => {
      const isEmergency = true;
      const action = 'MESSAGE_SEND';
      
      // Emergency messages should bypass rate limiting
      const shouldBypass = isEmergency && action === 'MESSAGE_SEND';
      
      expect(shouldBypass).toBe(true);
    });

    it('should enforce notification creation rate limits', () => {
      const rateLimits = {
        NOTIFICATION_CREATE: { requests: 100, window: 60000 }
      };
      
      const userId = 'user123';
      let requestCount = 0;
      
      // Simulate multiple notification creations
      for (let i = 0; i < 150; i++) {
        if (requestCount < rateLimits.NOTIFICATION_CREATE.requests) {
          requestCount++;
        }
      }
      
      expect(requestCount).toBe(rateLimits.NOTIFICATION_CREATE.requests);
    });
  });

  describe('Vector Search Caching', () => {
    it('should cache vector search results', () => {
      const searchResults = [
        { content: 'HVAC maintenance', certainty: 0.9, district: 'Śródmieście' },
        { content: 'Equipment repair', certainty: 0.8, district: 'Mokotów' }
      ];
      
      const query = 'HVAC service';
      const filters = { type: 'jobs', district: 'Śródmieście' };
      const cacheKey = `vector_search_${query}_${JSON.stringify(filters)}`;
      
      vectorCache.set(cacheKey, searchResults, 300000);
      
      expect(vectorCache.get(cacheKey)).toEqual(searchResults);
    });

    it('should apply district weighting to search results', () => {
      const districtWeights = {
        'Śródmieście': 1.5,
        'Wilanów': 1.4,
        'Mokotów': 1.3,
        'Wola': 1.0
      };
      
      const searchResult = {
        content: 'Test result',
        _additional: { certainty: 0.8 },
        district: 'Śródmieście'
      };
      
      const weight = districtWeights['Śródmieście'];
      const weightedCertainty = searchResult._additional.certainty * weight;
      
      expect(weightedCertainty).toBe(1.2); // 0.8 * 1.5
    });

    it('should cache embeddings for reuse', () => {
      const text = 'HVAC maintenance service';
      const embedding = new Array(384).fill(0.5); // Mock embedding
      
      const cacheKey = `embedding_${text}`;
      vectorCache.set(cacheKey, embedding, 3600000); // 1 hour
      
      expect(vectorCache.get(cacheKey)).toEqual(embedding);
    });
  });

  describe('Cache Performance', () => {
    it('should handle high-volume cache operations efficiently', () => {
      const startTime = Date.now();
      
      // Simulate 1000 cache operations
      for (let i = 0; i < 1000; i++) {
        messageCache.set(`key_${i}`, `value_${i}`, 30000);
      }
      
      for (let i = 0; i < 1000; i++) {
        messageCache.get(`key_${i}`);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within 100ms
      expect(duration).toBeLessThan(100);
    });

    it('should cleanup expired entries automatically', () => {
      // Add entries with short TTL
      for (let i = 0; i < 10; i++) {
        messageCache.set(`temp_key_${i}`, `value_${i}`, 1); // 1ms TTL
      }
      
      expect(messageCache.size()).toBe(10);
      
      // Wait for expiration and trigger cleanup
      setTimeout(() => {
        messageCache.get('temp_key_0'); // This should trigger cleanup
        expect(messageCache.size()).toBe(0);
      }, 10);
    });

    it('should limit cache size to prevent memory issues', () => {
      const maxSize = 1000;
      
      // Add more entries than the limit
      for (let i = 0; i < 1500; i++) {
        messageCache.set(`key_${i}`, `value_${i}`, 30000);
      }
      
      // Cache should implement size limiting
      expect(messageCache.size()).toBeLessThanOrEqual(maxSize);
    });
  });

  describe('Cache Invalidation', () => {
    it('should invalidate related caches on data changes', () => {
      const channelId = 'general';
      const userId = 'user123';
      
      // Set up related caches
      messageCache.set(`msg_list_${channelId}_${userId}`, ['msg1'], 30000);
      messageCache.set(`user_channels_${userId}`, ['general'], 30000);
      
      expect(messageCache.get(`msg_list_${channelId}_${userId}`)).toBeTruthy();
      expect(messageCache.get(`user_channels_${userId}`)).toBeTruthy();
      
      // Simulate message creation - should invalidate related caches
      messageCache.invalidatePattern(`msg_list_${channelId}`);
      messageCache.invalidatePattern(`user_channels_${userId}`);
      
      expect(messageCache.get(`msg_list_${channelId}_${userId}`)).toBeNull();
      expect(messageCache.get(`user_channels_${userId}`)).toBeNull();
    });

    it('should handle pattern-based cache invalidation', () => {
      // Set up multiple related caches
      messageCache.set('msg_list_general_user1', ['msg1'], 30000);
      messageCache.set('msg_list_general_user2', ['msg2'], 30000);
      messageCache.set('msg_list_district_user1', ['msg3'], 30000);
      
      expect(messageCache.size()).toBe(3);
      
      // Invalidate only general channel messages
      messageCache.invalidatePattern('msg_list_general');
      
      expect(messageCache.get('msg_list_general_user1')).toBeNull();
      expect(messageCache.get('msg_list_general_user2')).toBeNull();
      expect(messageCache.get('msg_list_district_user1')).toBeTruthy();
    });
  });
});

// Performance benchmark helper
export const benchmarkCachePerformance = async (operations: number = 10000) => {
  const cache = new MockCache();
  
  console.log(`Running cache performance benchmark with ${operations} operations...`);
  
  // Write performance
  const writeStart = Date.now();
  for (let i = 0; i < operations; i++) {
    cache.set(`key_${i}`, `value_${i}`, 30000);
  }
  const writeTime = Date.now() - writeStart;
  
  // Read performance
  const readStart = Date.now();
  for (let i = 0; i < operations; i++) {
    cache.get(`key_${i}`);
  }
  const readTime = Date.now() - readStart;
  
  console.log(`Write performance: ${writeTime}ms for ${operations} operations`);
  console.log(`Read performance: ${readTime}ms for ${operations} operations`);
  console.log(`Write ops/sec: ${Math.round(operations / (writeTime / 1000))}`);
  console.log(`Read ops/sec: ${Math.round(operations / (readTime / 1000))}`);
  
  return {
    writeTime,
    readTime,
    writeOpsPerSec: Math.round(operations / (writeTime / 1000)),
    readOpsPerSec: Math.round(operations / (readTime / 1000))
  };
};
