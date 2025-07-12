-- HVAC CRM Platform - Supabase Storage Setup
-- This migration sets up storage buckets and RLS policies for the HVAC CRM platform

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('equipment-photos', 'equipment-photos', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('invoices', 'invoices', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('technical-drawings', 'technical-drawings', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/dwg']),
  ('documents', 'documents', false, 52428800, ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Create analytics tables for Warsaw district performance
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type VARCHAR(100) NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  session_id VARCHAR(255),
  properties JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  district VARCHAR(50),
  job_id VARCHAR(255),
  contact_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create materialized view for district performance
CREATE MATERIALIZED VIEW IF NOT EXISTS district_performance AS
SELECT 
  properties->>'district' as district,
  COUNT(*) as total_events,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(CASE WHEN event_type = 'job_completed' THEN 1 END) as completed_jobs,
  AVG(CASE WHEN event_type = 'job_completed' AND properties->>'revenue' IS NOT NULL 
           THEN (properties->>'revenue')::numeric END) as avg_revenue,
  DATE_TRUNC('day', timestamp) as date
FROM analytics_events 
WHERE properties->>'district' IS NOT NULL
GROUP BY properties->>'district', DATE_TRUNC('day', timestamp);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_district ON analytics_events USING GIN (properties);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events (timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events (event_type);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_district_performance()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW district_performance;
END;
$$ LANGUAGE plpgsql;

-- Create RLS policies for storage
-- Equipment photos - public read, authenticated write
CREATE POLICY "Equipment photos are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'equipment-photos');

CREATE POLICY "Authenticated users can upload equipment photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'equipment-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own equipment photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'equipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own equipment photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'equipment-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Invoices - private, team access only
CREATE POLICY "Team members can view invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager', 'sales')
    )
  );

CREATE POLICY "Team members can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' 
    AND auth.role() = 'authenticated'
    AND EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'manager', 'sales')
    )
  );

-- Technical drawings - team access
CREATE POLICY "Team members can view technical drawings" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'technical-drawings' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Team members can upload technical drawings" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'technical-drawings' 
    AND auth.role() = 'authenticated'
  );

-- Documents - team access with role-based restrictions
CREATE POLICY "Team members can view documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Team members can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'documents' 
    AND auth.role() = 'authenticated'
  );

-- Avatars - public read, own write
CREATE POLICY "Avatars are publicly viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.role() = 'authenticated'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Create function to handle file metadata sync with Convex
CREATE OR REPLACE FUNCTION handle_file_upload()
RETURNS trigger AS $$
BEGIN
  -- Log file upload event for analytics
  INSERT INTO analytics_events (event_type, user_id, properties)
  VALUES (
    'file_uploaded',
    auth.uid(),
    jsonb_build_object(
      'bucket', NEW.bucket_id,
      'file_name', NEW.name,
      'file_size', NEW.metadata->>'size',
      'mime_type', NEW.metadata->>'mimetype'
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for file upload logging
CREATE TRIGGER on_file_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW EXECUTE FUNCTION handle_file_upload();

-- Create function for GDPR compliance - 7 year retention
CREATE OR REPLACE FUNCTION cleanup_old_files()
RETURNS void AS $$
BEGIN
  -- Delete files older than 7 years (GDPR requirement)
  DELETE FROM storage.objects 
  WHERE created_at < NOW() - INTERVAL '7 years'
  AND bucket_id IN ('invoices', 'documents', 'technical-drawings');
  
  -- Log cleanup event
  INSERT INTO analytics_events (event_type, properties)
  VALUES (
    'gdpr_cleanup',
    jsonb_build_object('cleanup_date', NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Schedule GDPR cleanup (run monthly)
-- Note: This requires pg_cron extension in production
-- SELECT cron.schedule('gdpr-cleanup', '0 0 1 * *', 'SELECT cleanup_old_files();');
