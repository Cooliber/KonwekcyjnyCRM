# PocketBase Integration Strategy for HVAC CRM

## 🎯 Strategic Overview

This document outlines the localhost-first development approach using PocketBase as the foundation for our HVAC CRM platform, while maintaining seamless integration with Convex and Weaviate for production scaling.

## 🏗️ Architecture Philosophy

### **Hybrid Multi-Backend Approach**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   PocketBase    │    │     Convex      │    │    Weaviate     │
│   (Localhost)   │◄──►│   (Production)  │◄──►│  (AI/Vectors)   │
│                 │    │                 │    │                 │
│ • File Storage  │    │ • Real-time     │    │ • Semantic      │
│ • Local Dev     │    │ • Sync          │    │   Search        │
│ • SQLite        │    │ • Global Scale  │    │ • Prophecy      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### **Core Benefits**
- ✅ **100% Localhost Development** - Zero cloud dependencies
- ✅ **Instant Setup** - Single binary, no configuration
- ✅ **Production Ready** - Seamless Convex scaling
- ✅ **AI-Powered** - Weaviate prophecy system
- ✅ **Cost Effective** - Local development, cloud production

## 📋 Implementation Phases

### **Phase 1: PocketBase Foundation (Week 1)**

#### **1.1 Local Setup & Configuration**
```bash
# Download and setup PocketBase
wget https://github.com/pocketbase/pocketbase/releases/download/v0.22.0/pocketbase_0.22.0_linux_amd64.zip
unzip pocketbase_0.22.0_linux_amd64.zip
chmod +x pocketbase

# Start with HVAC-specific configuration
./pocketbase serve --http=localhost:8090 --dir=./pb_data
```

#### **1.2 Schema Design for HVAC Operations**
```typescript
// PocketBase Collections Schema
interface HVACPocketBaseSchema {
  // Core Business Entities
  contacts: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address: string;
    district: 'Śródmieście' | 'Wilanów' | 'Mokotów' | 'Żoliborz' | 'Ursynów' | 'Wola' | 'Praga-Południe' | 'Targówek';
    affluenceScore: number;
    propertyType: 'apartment' | 'house' | 'commercial';
    created: string;
    updated: string;
  };
  
  jobs: {
    id: string;
    contactId: string; // Relation to contacts
    title: string;
    description: string;
    type: 'installation' | 'maintenance' | 'repair' | 'inspection';
    status: 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    scheduledDate: string;
    completedDate?: string;
    technicianId?: string;
    coordinates: { lat: number; lng: number };
    estimatedDuration: number;
    actualDuration?: number;
    created: string;
    updated: string;
  };
  
  // File Management
  equipment_photos: {
    id: string;
    jobId: string;
    contactId: string;
    filename: string;
    filesize: number;
    mimetype: string;
    description: string;
    aiAnalysis?: string; // OCR/AI results
    created: string;
  };
  
  invoices: {
    id: string;
    jobId: string;
    contactId: string;
    filename: string;
    filesize: number;
    ocrData?: string; // Extracted text
    totalAmount?: number;
    status: 'pending' | 'processed' | 'paid';
    created: string;
  };
  
  // Real-time Events
  realtime_events: {
    id: string;
    type: 'job_update' | 'technician_location' | 'emergency_alert' | 'message';
    data: string; // JSON payload
    targetUsers: string[]; // Array of user IDs
    district?: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    processed: boolean;
    created: string;
  };
}
```

#### **1.3 TypeScript SDK Integration**
```typescript
// lib/pocketbase.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase('http://localhost:8090');

// Type-safe collections
export const collections = {
  contacts: pb.collection('contacts'),
  jobs: pb.collection('jobs'),
  equipment_photos: pb.collection('equipment_photos'),
  invoices: pb.collection('invoices'),
  realtime_events: pb.collection('realtime_events'),
} as const;

// Real-time subscriptions
export const subscribeToJobUpdates = (callback: (data: any) => void) => {
  return pb.collection('jobs').subscribe('*', callback);
};

export const subscribeToEmergencyAlerts = (district: string, callback: (data: any) => void) => {
  return pb.collection('realtime_events').subscribe('*', (e) => {
    if (e.record.type === 'emergency_alert' && e.record.district === district) {
      callback(e);
    }
  });
};
```

### **Phase 2: Hybrid Data Sync (Week 2)**

#### **2.1 Bidirectional Sync Strategy**
```typescript
// lib/hybrid-sync.ts
interface SyncConfig {
  pocketbase: PocketBase;
  convex: ConvexClient;
  weaviate: WeaviateClient;
  mode: 'development' | 'production' | 'hybrid';
}

class HybridDataSync {
  constructor(private config: SyncConfig) {}
  
  // Development: PocketBase primary, Convex secondary
  async syncToProduction(entity: 'contacts' | 'jobs', data: any) {
    if (this.config.mode === 'development') {
      // Save to PocketBase first (immediate)
      const pbResult = await this.config.pocketbase.collection(entity).create(data);
      
      // Queue for Convex sync (background)
      await this.queueConvexSync(entity, pbResult);
      
      return pbResult;
    }
  }
  
  // Production: Convex primary, PocketBase cache
  async syncFromProduction(entity: string) {
    if (this.config.mode === 'production') {
      const convexData = await this.config.convex.query(api[entity].list);
      
      // Update local PocketBase cache
      for (const item of convexData) {
        await this.config.pocketbase.collection(entity).upsert(item);
      }
    }
  }
  
  // AI/Vector operations always go to Weaviate
  async syncToWeaviate(data: any, className: string) {
    return await this.config.weaviate.data.creator()
      .withClassName(className)
      .withProperties(data)
      .do();
  }
}
```

#### **2.2 File Storage Strategy**
```typescript
// lib/file-storage.ts
class HybridFileStorage {
  async uploadEquipmentPhoto(file: File, jobId: string, contactId: string) {
    // Always start with PocketBase for immediate storage
    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobId', jobId);
    formData.append('contactId', contactId);
    formData.append('description', `Equipment photo for job ${jobId}`);
    
    const pbResult = await pb.collection('equipment_photos').create(formData);
    
    // Background: AI analysis via Weaviate
    this.scheduleAIAnalysis(pbResult.id, file);
    
    // Background: Sync to Convex/Supabase for production
    if (process.env.NODE_ENV === 'production') {
      this.syncToProduction(pbResult);
    }
    
    return pbResult;
  }
  
  private async scheduleAIAnalysis(photoId: string, file: File) {
    // Use Weaviate for image analysis
    const analysis = await this.analyzeEquipmentImage(file);
    
    // Update PocketBase with AI results
    await pb.collection('equipment_photos').update(photoId, {
      aiAnalysis: JSON.stringify(analysis)
    });
  }
}
```

### **Phase 3: Real-time Features (Week 3)**

#### **3.1 Emergency Alert System**
```typescript
// components/EmergencyAlertSystem.tsx
export const EmergencyAlertSystem = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  
  useEffect(() => {
    // Subscribe to emergency alerts for current district
    const unsubscribe = pb.collection('realtime_events').subscribe('*', (e) => {
      if (e.record.type === 'emergency_alert') {
        setAlerts(prev => [e.record, ...prev]);
        
        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 Emergency Alert', {
            body: e.record.data,
            icon: '/emergency-icon.png'
          });
        }
      }
    });
    
    return () => unsubscribe();
  }, []);
  
  return (
    <div className="emergency-alerts">
      {alerts.map(alert => (
        <Alert key={alert.id} variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Emergency Alert - {alert.district}</AlertTitle>
          <AlertDescription>{alert.data}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};
```

#### **3.2 Technician Location Tracking**
```typescript
// hooks/useTechnicianTracking.ts
export const useTechnicianTracking = (technicianId: string) => {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  
  useEffect(() => {
    // Real-time location updates via PocketBase
    const unsubscribe = pb.collection('realtime_events').subscribe('*', (e) => {
      if (e.record.type === 'technician_location' && 
          JSON.parse(e.record.data).technicianId === technicianId) {
        setLocation(JSON.parse(e.record.data).coordinates);
      }
    });
    
    return () => unsubscribe();
  }, [technicianId]);
  
  const updateLocation = async (lat: number, lng: number) => {
    await pb.collection('realtime_events').create({
      type: 'technician_location',
      data: JSON.stringify({ technicianId, coordinates: { lat, lng } }),
      targetUsers: ['all'], // Broadcast to all users
      priority: 'low',
      processed: false
    });
  };
  
  return { location, updateLocation };
};
```

## 🔧 Development Workflow

### **Local Development Setup**
```bash
# 1. Start PocketBase
./pocketbase serve --http=localhost:8090

# 2. Start Weaviate (Docker)
docker run -p 8080:8080 semitechnologies/weaviate:latest

# 3. Start Next.js development
npm run dev

# 4. Optional: Start Convex for testing sync
npx convex dev
```

### **Environment Configuration**
```typescript
// lib/config.ts
export const config = {
  development: {
    primary: 'pocketbase',
    pocketbaseUrl: 'http://localhost:8090',
    weaviateUrl: 'http://localhost:8080',
    convexUrl: process.env.CONVEX_URL, // Optional for sync testing
  },
  production: {
    primary: 'convex',
    convexUrl: process.env.CONVEX_URL,
    supabaseUrl: process.env.SUPABASE_URL,
    weaviateUrl: process.env.WEAVIATE_URL,
    pocketbaseUrl: 'http://localhost:8090', // Local cache
  }
};
```

## 🚀 Migration Strategy

### **Development → Production**
1. **Data Export**: Export PocketBase data to JSON
2. **Schema Mapping**: Transform to Convex schema format
3. **Bulk Import**: Import to Convex using batch operations
4. **File Migration**: Move files from PocketBase to Supabase
5. **Vector Sync**: Ensure Weaviate has all embeddings

### **Rollback Strategy**
1. **Local Backup**: Always maintain PocketBase as local backup
2. **Sync Verification**: Verify data integrity before switching
3. **Gradual Migration**: Migrate by feature/module
4. **Monitoring**: Real-time sync monitoring and alerts

## 📊 Performance Benefits

### **Development Speed**
- ⚡ **Instant Setup**: 30 seconds vs 30 minutes
- ⚡ **No Network Latency**: Local SQLite performance
- ⚡ **Offline Development**: Work without internet
- ⚡ **Real-time Testing**: Immediate WebSocket testing

### **Cost Optimization**
- 💰 **Zero Development Costs**: No cloud usage during dev
- 💰 **Reduced API Calls**: Local operations only
- 💰 **Efficient Scaling**: Pay only for production usage
- 💰 **Resource Optimization**: Local compute for development

## 🔮 Future Enhancements

### **Advanced Features**
- **Multi-tenant PocketBase**: Separate databases per developer
- **Automated Sync**: Background sync with conflict resolution
- **Performance Monitoring**: Real-time metrics dashboard
- **AI Integration**: Local AI models for development

This strategy provides the perfect balance of localhost development speed with production scalability, ensuring our HVAC CRM can compete with and surpass Bitrix24 capabilities.
