import { createClient } from '@supabase/supabase-js';

// Supabase configuration with fallback for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://localhost:54321';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'development-key';

// Only throw error in production if environment variables are missing
if (import.meta.env.PROD && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  throw new Error('Missing Supabase environment variables in production');
}

// Log warning in development if using fallback values
if (import.meta.env.DEV && (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY)) {
  console.warn('⚠️ Using fallback Supabase configuration for development. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local');
}

// Create Supabase client with enhanced configuration
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'hvac-crm-platform'
    }
  }
});

// Storage bucket names
export const STORAGE_BUCKETS = {
  EQUIPMENT_PHOTOS: 'equipment-photos',
  INVOICES: 'invoices',
  TECHNICAL_DRAWINGS: 'technical-drawings',
  DOCUMENTS: 'documents',
  AVATARS: 'avatars'
} as const;

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  ALLOWED_DOCUMENT_TYPES: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  COMPRESSION_QUALITY: 0.8,
  THUMBNAIL_SIZE: 300
} as const;

// Real-time channel configuration
export const REALTIME_CHANNELS = {
  EMERGENCY_ALERTS: 'emergency-alerts',
  TECHNICIAN_PRESENCE: 'technician-presence',
  JOB_UPDATES: 'job-updates',
  CHAT_MESSAGES: 'chat-messages'
} as const;

// Helper function to get file URL
export const getFileUrl = (bucket: string, path: string): string => {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
};

// Type definitions for Supabase responses
export interface SupabaseUploadResponse {
  data: {
    id: string;
    path: string;
    fullPath: string;
  } | null;
  error: {
    message: string;
    statusCode?: string;
  } | null;
}

export interface SupabaseDeleteResponse {
  data: {
    id: string;
    path: string;
  }[] | null;
  error: {
    message: string;
    statusCode?: string;
  } | null;
}

export interface SupabaseSignedUrlResponse {
  data: {
    signedUrl: string;
  } | null;
  error: {
    message: string;
    statusCode?: string;
  } | null;
}

// Helper function to upload file with progress
export const uploadFileWithProgress = async (
  bucket: string,
  path: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<SupabaseUploadResponse> => {
  return new Promise((resolve) => {
    const upload = supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    // Simulate progress for now (Supabase doesn't provide native progress)
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 20;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      onProgress?.(progress);
    }, 200);

    upload.then((result) => {
      clearInterval(interval);
      onProgress?.(100);
      resolve(result);
    });
  });
};

// Helper function to delete file
export const deleteFile = async (bucket: string, path: string): Promise<SupabaseDeleteResponse> => {
  return supabase.storage.from(bucket).remove([path]);
};

// Helper function to create signed URL for private files
export const createSignedUrl = async (
  bucket: string,
  path: string,
  expiresIn: number = 3600
): Promise<SupabaseSignedUrlResponse> => {
  return supabase.storage.from(bucket).createSignedUrl(path, expiresIn);
};

// Type definitions for Supabase tables
export interface SupabaseFile {
  id: string;
  name: string;
  bucket_id: string;
  owner: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
  metadata: {
    eTag: string;
    size: number;
    mimetype: string;
    cacheControl: string;
  };
}

export interface AnalyticsEvent {
  id: string;
  event_type: string;
  user_id: string;
  session_id: string;
  properties: Record<string, any>;
  timestamp: string;
  district?: string;
  job_id?: string;
  contact_id?: string;
}

export interface MaterializedView {
  id: string;
  view_name: string;
  query: string;
  refresh_interval: string;
  last_refreshed: string;
  status: 'active' | 'inactive' | 'error';
}
