/**
 * Hybrid Data Sync Manager
 * Orchestrates data flow between PocketBase (localhost), Convex (production), and Weaviate (AI)
 */

import { ConvexClient } from 'convex/browser';
import { pb, collections, type Contact, type Job } from './client';
import { api } from '../../convex/_generated/api';

interface SyncConfig {
  mode: 'development' | 'production' | 'hybrid';
  convexUrl?: string;
  weaviateUrl?: string;
  enableBackgroundSync: boolean;
  syncIntervalMs: number;
}

interface SyncResult {
  success: boolean;
  recordsProcessed: number;
  errors: string[];
  timestamp: string;
}

interface SyncQueue {
  id: string;
  entity: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
}

export class HybridDataSync {
  private convex?: ConvexClient;
  private syncQueue: SyncQueue[] = [];
  private isProcessing = false;
  private syncInterval?: NodeJS.Timeout;

  constructor(private config: SyncConfig) {
    if (config.convexUrl) {
      this.convex = new ConvexClient(config.convexUrl);
    }

    if (config.enableBackgroundSync) {
      this.startBackgroundSync();
    }
  }

  /**
   * Development Mode: PocketBase Primary, Convex Secondary
   */
  async createContact(data: Omit<Contact, 'id' | 'created' | 'updated'>): Promise<Contact> {
    try {
      // Always save to PocketBase first (immediate response)
      const pbResult = await collections.contacts.create(data);
      
      // Queue for Convex sync if in hybrid/production mode
      if (this.config.mode !== 'development' && this.convex) {
        await this.queueSync('contacts', 'create', pbResult);
      }
      
      // Queue for Weaviate vector embedding (background)
      await this.queueVectorSync('contacts', pbResult);
      
      return pbResult;
    } catch (error) {
      console.error('Failed to create contact:', error);
      throw error;
    }
  }

  async createJob(data: Omit<Job, 'id' | 'created' | 'updated'>): Promise<Job> {
    try {
      // Save to PocketBase first
      const pbResult = await collections.jobs.create(data);
      
      // Queue for Convex sync
      if (this.config.mode !== 'development' && this.convex) {
        await this.queueSync('jobs', 'create', pbResult);
      }
      
      // Queue for Weaviate (job descriptions for semantic search)
      await this.queueVectorSync('jobs', pbResult);
      
      // Trigger real-time event
      await this.triggerRealtimeEvent('job_update', {
        jobId: pbResult.id,
        status: pbResult.status,
        district: await this.getJobDistrict(pbResult.contactId)
      });
      
      return pbResult;
    } catch (error) {
      console.error('Failed to create job:', error);
      throw error;
    }
  }

  /**
   * Production Mode: Convex Primary, PocketBase Cache
   */
  async syncFromProduction(): Promise<SyncResult> {
    if (!this.convex) {
      return {
        success: false,
        recordsProcessed: 0,
        errors: ['Convex client not initialized'],
        timestamp: new Date().toISOString()
      };
    }

    const result: SyncResult = {
      success: true,
      recordsProcessed: 0,
      errors: [],
      timestamp: new Date().toISOString()
    };

    try {
      // Sync contacts from Convex to PocketBase
      const convexContacts = await this.convex.query(api.contacts.list, {});
      for (const contact of convexContacts) {
        try {
          await collections.contacts.collection.upsert(contact);
          result.recordsProcessed++;
        } catch (error) {
          result.errors.push(`Failed to sync contact ${contact.id}: ${error}`);
        }
      }

      // Sync jobs from Convex to PocketBase
      const convexJobs = await this.convex.query(api.jobs.list, {});
      for (const job of convexJobs) {
        try {
          await collections.jobs.collection.upsert(job);
          result.recordsProcessed++;
        } catch (error) {
          result.errors.push(`Failed to sync job ${job.id}: ${error}`);
        }
      }

    } catch (error) {
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    }

    return result;
  }

  /**
   * Queue Management
   */
  private async queueSync(entity: string, operation: 'create' | 'update' | 'delete', data: any) {
    const queueItem: SyncQueue = {
      id: crypto.randomUUID(),
      entity,
      operation,
      data,
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date().toISOString()
    };

    this.syncQueue.push(queueItem);
    
    // Store in PocketBase for persistence
    await collections.realtime_events.create({
      type: 'job_update',
      data: JSON.stringify(queueItem),
      targetUsers: ['system'],
      priority: 'low',
      processed: false
    });
  }

  private async queueVectorSync(entity: string, data: any) {
    // Queue for Weaviate vector embedding
    await collections.realtime_events.create({
      type: 'job_update',
      data: JSON.stringify({
        type: 'vector_sync',
        entity,
        data,
        weaviateClass: this.getWeaviateClass(entity)
      }),
      targetUsers: ['ai_system'],
      priority: 'medium',
      processed: false
    });
  }

  /**
   * Background Sync Processing
   */
  private startBackgroundSync() {
    this.syncInterval = setInterval(async () => {
      if (!this.isProcessing && this.syncQueue.length > 0) {
        await this.processSyncQueue();
      }
    }, this.config.syncIntervalMs);
  }

  private async processSyncQueue() {
    if (this.isProcessing || !this.convex) return;
    
    this.isProcessing = true;
    
    try {
      const batch = this.syncQueue.splice(0, 10); // Process 10 items at a time
      
      for (const item of batch) {
        try {
          await this.syncToConvex(item);
        } catch (error) {
          item.retryCount++;
          if (item.retryCount < item.maxRetries) {
            this.syncQueue.push(item); // Re-queue for retry
          } else {
            console.error(`Failed to sync after ${item.maxRetries} retries:`, item, error);
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  private async syncToConvex(item: SyncQueue) {
    if (!this.convex) throw new Error('Convex client not initialized');

    switch (item.entity) {
      case 'contacts':
        if (item.operation === 'create') {
          await this.convex.mutation(api.contacts.create, item.data);
        } else if (item.operation === 'update') {
          await this.convex.mutation(api.contacts.update, { id: item.data.id, ...item.data });
        }
        break;
        
      case 'jobs':
        if (item.operation === 'create') {
          await this.convex.mutation(api.jobs.create, item.data);
        } else if (item.operation === 'update') {
          await this.convex.mutation(api.jobs.update, { id: item.data.id, ...item.data });
        }
        break;
        
      default:
        throw new Error(`Unknown entity type: ${item.entity}`);
    }
  }

  /**
   * Real-time Event System
   */
  private async triggerRealtimeEvent(type: string, data: any) {
    await collections.realtime_events.create({
      type: type as any,
      data: JSON.stringify(data),
      targetUsers: ['all'],
      priority: 'medium',
      processed: false
    });
  }

  /**
   * Utility Methods
   */
  private async getJobDistrict(contactId: string): Promise<string> {
    try {
      const contact = await collections.contacts.getById(contactId);
      return contact.district;
    } catch {
      return 'Unknown';
    }
  }

  private getWeaviateClass(entity: string): string {
    const mapping = {
      contacts: 'HVACContact',
      jobs: 'HVACJob',
      equipment_photos: 'EquipmentImage',
      invoices: 'Invoice'
    };
    return mapping[entity as keyof typeof mapping] || 'Unknown';
  }

  /**
   * Health and Monitoring
   */
  async getQueueStatus() {
    return {
      queueLength: this.syncQueue.length,
      isProcessing: this.isProcessing,
      failedItems: this.syncQueue.filter(item => item.retryCount >= item.maxRetries).length,
      oldestItem: this.syncQueue.length > 0 ? this.syncQueue[0].createdAt : null
    };
  }

  async clearQueue() {
    this.syncQueue = [];
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Singleton instance
let syncManager: HybridDataSync | null = null;

export const createSyncManager = (config: SyncConfig): HybridDataSync => {
  if (syncManager) {
    syncManager.stop();
  }
  
  syncManager = new HybridDataSync(config);
  return syncManager;
};

export const getSyncManager = (): HybridDataSync | null => {
  return syncManager;
};

// Default configuration based on environment
export const getDefaultSyncConfig = (): SyncConfig => {
  return {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    convexUrl: process.env.NEXT_PUBLIC_CONVEX_URL,
    weaviateUrl: process.env.NEXT_PUBLIC_WEAVIATE_URL || 'http://localhost:8080',
    enableBackgroundSync: true,
    syncIntervalMs: 5000 // 5 seconds
  };
};
