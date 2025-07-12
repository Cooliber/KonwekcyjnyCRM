/**
 * PocketBase Client Configuration for HVAC CRM
 * Localhost-first development with production sync capabilities
 */

import PocketBase from 'pocketbase';
import { z } from 'zod';

// Environment configuration
const config = {
  development: {
    url: 'http://localhost:8090',
    primary: true,
  },
  production: {
    url: process.env.POCKETBASE_URL || 'http://localhost:8090',
    primary: false, // Convex is primary in production
  }
} as const;

// Initialize PocketBase client
export const pb = new PocketBase(
  process.env.NODE_ENV === 'production' 
    ? config.production.url 
    : config.development.url
);

// Type-safe schema definitions
export const ContactSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(1),
  address: z.string().min(1),
  district: z.enum([
    'Śródmieście', 
    'Wilanów', 
    'Mokotów', 
    'Żoliborz', 
    'Ursynów', 
    'Wola', 
    'Praga-Południe', 
    'Targówek'
  ]),
  affluenceScore: z.number().min(0).max(1),
  propertyType: z.enum(['apartment', 'house', 'commercial']),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export const JobSchema = z.object({
  id: z.string().optional(),
  contactId: z.string(),
  title: z.string().min(1),
  description: z.string(),
  type: z.enum(['installation', 'maintenance', 'repair', 'inspection']),
  status: z.enum(['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  scheduledDate: z.string(),
  completedDate: z.string().optional(),
  technicianId: z.string().optional(),
  coordinates: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  estimatedDuration: z.number().positive(),
  actualDuration: z.number().positive().optional(),
  created: z.string().optional(),
  updated: z.string().optional(),
});

export const EquipmentPhotoSchema = z.object({
  id: z.string().optional(),
  jobId: z.string(),
  contactId: z.string(),
  filename: z.string(),
  filesize: z.number().positive(),
  mimetype: z.string(),
  description: z.string(),
  aiAnalysis: z.string().optional(),
  created: z.string().optional(),
});

export const RealtimeEventSchema = z.object({
  id: z.string().optional(),
  type: z.enum(['job_update', 'technician_location', 'emergency_alert', 'message']),
  data: z.string(), // JSON payload
  targetUsers: z.array(z.string()),
  district: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  processed: z.boolean().default(false),
  created: z.string().optional(),
});

// Type exports
export type Contact = z.infer<typeof ContactSchema>;
export type Job = z.infer<typeof JobSchema>;
export type EquipmentPhoto = z.infer<typeof EquipmentPhotoSchema>;
export type RealtimeEvent = z.infer<typeof RealtimeEventSchema>;

// Collection helpers with type safety
export const collections = {
  contacts: {
    collection: pb.collection('contacts'),
    schema: ContactSchema,
    
    async create(data: Omit<Contact, 'id' | 'created' | 'updated'>) {
      const validated = ContactSchema.omit({ id: true, created: true, updated: true }).parse(data);
      return await this.collection.create(validated);
    },
    
    async list(filter?: string, sort?: string) {
      return await this.collection.getList(1, 50, { filter, sort });
    },
    
    async getById(id: string) {
      return await this.collection.getOne(id);
    },
    
    async update(id: string, data: Partial<Contact>) {
      const validated = ContactSchema.partial().parse(data);
      return await this.collection.update(id, validated);
    },
    
    async delete(id: string) {
      return await this.collection.delete(id);
    },
    
    // HVAC-specific methods
    async getByDistrict(district: Contact['district']) {
      return await this.collection.getList(1, 50, {
        filter: `district = "${district}"`
      });
    },
    
    async getHighAffluence(threshold: number = 0.7) {
      return await this.collection.getList(1, 50, {
        filter: `affluenceScore >= ${threshold}`,
        sort: '-affluenceScore'
      });
    }
  },
  
  jobs: {
    collection: pb.collection('jobs'),
    schema: JobSchema,
    
    async create(data: Omit<Job, 'id' | 'created' | 'updated'>) {
      const validated = JobSchema.omit({ id: true, created: true, updated: true }).parse(data);
      return await this.collection.create(validated);
    },
    
    async list(filter?: string, sort?: string) {
      return await this.collection.getList(1, 50, { filter, sort });
    },
    
    async getById(id: string) {
      return await this.collection.getOne(id);
    },
    
    async update(id: string, data: Partial<Job>) {
      const validated = JobSchema.partial().parse(data);
      return await this.collection.update(id, validated);
    },
    
    // HVAC-specific methods
    async getByTechnician(technicianId: string) {
      return await this.collection.getList(1, 50, {
        filter: `technicianId = "${technicianId}"`,
        sort: '-scheduledDate'
      });
    },
    
    async getByStatus(status: Job['status']) {
      return await this.collection.getList(1, 50, {
        filter: `status = "${status}"`,
        sort: '-created'
      });
    },
    
    async getUrgentJobs() {
      return await this.collection.getList(1, 50, {
        filter: `priority = "urgent" && status != "completed"`,
        sort: '-created'
      });
    },
    
    async getJobsInRadius(lat: number, lng: number, radiusKm: number = 5) {
      // Note: PocketBase doesn't have built-in geo queries, 
      // so we'll fetch all and filter in memory for now
      const allJobs = await this.collection.getFullList();
      return allJobs.filter(job => {
        const distance = this.calculateDistance(
          lat, lng, 
          job.coordinates.lat, job.coordinates.lng
        );
        return distance <= radiusKm;
      });
    },
    
    calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }
  },
  
  equipment_photos: {
    collection: pb.collection('equipment_photos'),
    schema: EquipmentPhotoSchema,
    
    async upload(file: File, jobId: string, contactId: string, description: string) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('jobId', jobId);
      formData.append('contactId', contactId);
      formData.append('filename', file.name);
      formData.append('filesize', file.size.toString());
      formData.append('mimetype', file.type);
      formData.append('description', description);
      
      return await this.collection.create(formData);
    },
    
    async getByJob(jobId: string) {
      return await this.collection.getList(1, 50, {
        filter: `jobId = "${jobId}"`,
        sort: '-created'
      });
    },
    
    async getByContact(contactId: string) {
      return await this.collection.getList(1, 50, {
        filter: `contactId = "${contactId}"`,
        sort: '-created'
      });
    },
    
    getFileUrl(record: any, filename: string) {
      return this.collection.getFileUrl(record, filename);
    }
  },
  
  realtime_events: {
    collection: pb.collection('realtime_events'),
    schema: RealtimeEventSchema,
    
    async create(data: Omit<RealtimeEvent, 'id' | 'created'>) {
      const validated = RealtimeEventSchema.omit({ id: true, created: true }).parse(data);
      return await this.collection.create(validated);
    },
    
    async getUnprocessed() {
      return await this.collection.getList(1, 100, {
        filter: 'processed = false',
        sort: '-created'
      });
    },
    
    async markProcessed(id: string) {
      return await this.collection.update(id, { processed: true });
    },
    
    // Real-time subscriptions
    subscribeToAll(callback: (data: any) => void) {
      return this.collection.subscribe('*', callback);
    },
    
    subscribeToType(type: RealtimeEvent['type'], callback: (data: any) => void) {
      return this.collection.subscribe('*', (e) => {
        if (e.record.type === type) {
          callback(e);
        }
      });
    },
    
    subscribeToDistrict(district: string, callback: (data: any) => void) {
      return this.collection.subscribe('*', (e) => {
        if (e.record.district === district) {
          callback(e);
        }
      });
    }
  }
} as const;

// Authentication helpers
export const auth = {
  async login(email: string, password: string) {
    return await pb.collection('users').authWithPassword(email, password);
  },
  
  async logout() {
    pb.authStore.clear();
  },
  
  get isValid() {
    return pb.authStore.isValid;
  },
  
  get user() {
    return pb.authStore.model;
  },
  
  get token() {
    return pb.authStore.token;
  }
};

// Health check
export const healthCheck = async () => {
  try {
    await pb.health.check();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    return { 
      status: 'unhealthy', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
};

export default pb;
