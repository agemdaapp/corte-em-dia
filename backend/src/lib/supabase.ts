import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL ?? ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env vars missing')
}

if (!supabaseServiceKey) {
  throw new Error('Supabase service role key missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})


