import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gphukuroareuwjxrotzo.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    'sb_publishable_K1bW0jEWLzoM6ENhEVvfiQ_qvi3SF3S'

// Client-side Supabase client (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (API routes)
export function createServerClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
    })
}
