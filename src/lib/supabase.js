import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Export a flag so AuthContext can show a friendly setup screen instead of crashing
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Only create the client when keys are present
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null
