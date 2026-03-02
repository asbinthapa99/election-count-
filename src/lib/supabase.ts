import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcytrexcffkfoujrgdhp.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_zu--RQMAX5qJctUKNye9kg__YHo_-5F'

// Client-side Supabase client (browser)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (API routes)
export function createServerClient() {
    return createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
    })
}
