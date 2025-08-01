import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vsklfrkjxvcxtseqwfve.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZza2xmcmtqeHZjeHRzZXF3ZnZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1Njk2NTEsImV4cCI6MjA2NTE0NTY1MX0.B-Xog2WQO9M4pPNnFyPQFvxj5yYpUwrFbVIUwcVrerc';

let supabaseInstance = null;

if (supabaseUrl && supabaseAnonKey) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error("Error creating Supabase client:", error);
  }
} else {
  console.warn("Supabase URL or Anon Key is missing. Supabase client not initialized.");
}

export const supabase = supabaseInstance;