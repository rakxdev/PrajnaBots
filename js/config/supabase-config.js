/**
 * Supabase Configuration
 * Project: PrajnaBot-Auth
 * Created: October 31, 2025
 */

import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Supabase Project Configuration
const SUPABASE_URL = 'https://crlxxoajmheguszdabts.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNybHh4b2FqbWhlZ3VzemRhYnRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTU5MzMsImV4cCI6MjA3NzQ5MTkzM30.eoNenzfsFGwh2UMyks-ZCZiAXjn9mj_RIDCiKdB_OJc';

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Export configuration for reference
export const config = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  projectId: 'crlxxoajmheguszdabts'
};

console.log('✅ Supabase initialized:', SUPABASE_URL);
