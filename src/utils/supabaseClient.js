import { createClient } from '@supabase/supabase-js';

let client = null;
let clientKey = '';

export function getSupabase(url, key) {
  if (!url || !key) return null;
  const cacheKey = url + '::' + key;
  if (client && clientKey === cacheKey) return client;
  try {
    client = createClient(url, key, { auth: { persistSession: false } });
    clientKey = cacheKey;
    return client;
  } catch (e) {
    console.warn('Supabase client creation failed', e);
    return null;
  }
}

export const SETUP_SQL = `-- Run this in your Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id TEXT NOT NULL UNIQUE,
  tasks JSONB DEFAULT '{}',
  daily_tasks JSONB DEFAULT '[]',
  gym_program JSONB DEFAULT '[]',
  habits JSONB DEFAULT '[]',
  calendar_events JSONB DEFAULT '[]',
  pomodoro_history JSONB DEFAULT '[]',
  pomodoro_settings JSONB DEFAULT '{}',
  flashcards JSONB DEFAULT '[]',
  games JSONB DEFAULT '[]',
  german JSONB DEFAULT '{}',
  app_settings JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security:
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- Allow all operations with anon key (personal app, no auth needed):
CREATE POLICY "Allow all for anon" ON user_data
  FOR ALL USING (true) WITH CHECK (true);

-- If the table already exists, add the new German data column:
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS german JSONB DEFAULT '{}';
ALTER TABLE user_data ADD COLUMN IF NOT EXISTS daily_tasks JSONB DEFAULT '[]';

-- Optional file bucket for future/online language-file storage:
-- Create a private bucket named: language-files
-- (The app keeps the local IndexedDB copy; cloud file sync can be enabled separately.)` ;
