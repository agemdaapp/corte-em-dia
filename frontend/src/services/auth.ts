import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase env vars missing')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export function signIn(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password })
}

export function signOut() {
  return supabase.auth.signOut()
}

export function getSession() {
  return supabase.auth.getSession()
}

export async function ensureProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return
  }

  const { user } = userData
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle()

  if (profileError || profile) {
    return
  }

  const name =
    typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : null

  await supabase.from('profiles').insert({
    id: user.id,
    email: user.email,
    role: 'professional',
    name,
  })
}

export async function getProfile() {
  const { data: userData, error: userError } = await supabase.auth.getUser()

  if (userError || !userData.user) {
    return { data: null, error: userError }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, role, name')
    .eq('id', userData.user.id)
    .maybeSingle()

  if (error) {
    return { data: null, error }
  }

  return { data, error: null }
}

