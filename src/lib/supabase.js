import { createClient } from '@supabase/supabase-js'

// Trim any accidental whitespace / carriage-returns from env variables
// (Windows .env files often have \r at line endings which corrupts JWT tokens)
const supabaseUrl  = (import.meta.env.VITE_SUPABASE_URL  || '').trim()
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim()

// Export a flag so AuthContext can show a friendly setup screen instead of crashing
export const supabaseConfigured = !!(supabaseUrl && supabaseAnonKey)

// Only create the client when keys are present
// persistSession=true + autoRefreshToken=true keeps users logged in across restarts
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sacred-word-auth',
      }
    })
  : null
