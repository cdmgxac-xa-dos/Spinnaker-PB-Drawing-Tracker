import { createClient } from '@supabase/supabase-js'
import { requireSupabase, supabase } from '@/lib/supabaseClient'
import type { AppRole, Profile } from '@/types'

// A throwaway client (no localStorage session persistence) used only for
// provisioning new accounts. auth.signUp() on the *main* client would sign
// the browser in as the newly created user, silently ending the admin's own
// session — this keeps account creation from ever touching the caller's
// session.
function ephemeralClient() {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

export async function adminExists(): Promise<boolean> {
  const { data, error } = await requireSupabase().rpc('admin_exists')
  if (error) throw error
  return Boolean(data)
}

export async function loginDirectory(): Promise<Pick<Profile, 'id' | 'full_name' | 'role'>[]> {
  const { data, error } = await requireSupabase()
    .from('public_login_directory')
    .select('id, full_name, role')
    .order('full_name')
  if (error) throw error
  return data as Pick<Profile, 'id' | 'full_name' | 'role'>[]
}

/** Bootstrap the very first XA Admin / Site Engineer account, password "0000". */
export async function bootstrapFirstAdmin(fullName: string, email: string) {
  const client = ephemeralClient()
  const { data, error } = await client.auth.signUp({ email, password: '000000' })
  if (error) throw error
  const userId = data.user?.id
  if (!userId) throw new Error('Sign-up did not return a user')

  const { error: profileError } = await client.from('profiles').insert({
    id: userId,
    full_name: fullName,
    email,
    role: 'xa_admin',
    must_change_password: true,
  })
  if (profileError) throw profileError
}

/** XA Admin creates any other account (xa_admin, draftsman, daaa, gpi). */
export async function createAccount(fullName: string, email: string, role: AppRole) {
  const client = ephemeralClient()
  const password = role === 'xa_admin' ? '000000' : randomPassword()
  const { data, error } = await client.auth.signUp({ email, password })
  if (error) throw error
  const userId = data.user?.id
  if (!userId) throw new Error('Sign-up did not return a user')

  const { error: profileError } = await client.from('profiles').insert({
    id: userId,
    full_name: fullName,
    email,
    role,
    must_change_password: role === 'xa_admin',
  })
  if (profileError) throw profileError
}

export async function signInWithPassword(email: string, password: string) {
  const { error } = await requireSupabase().auth.signInWithPassword({ email, password })
  if (error) throw error
}

/**
 * Draftsman / DAAA / GPI / Landco sign-in: no password to type, but a real
 * magic-link email that must actually be opened — this is what stops
 * anyone with the login link from just clicking someone else's name.
 * The Edge Function looks up the account's real email server-side (never
 * sent to this browser) and triggers Supabase's own magic-link email.
 * There's no token to install here; the session only gets created once the
 * person clicks the link in their inbox and lands back on the site, which
 * supabase-js picks up automatically (detectSessionInUrl).
 */
export async function requestMagicLink(profileId: string): Promise<{ full_name: string }> {
  const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/passwordless-login`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({ profile_id: profileId }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Could not send sign-in email')
  return { full_name: body.full_name }
}

export async function changePassword(newPassword: string) {
  const client = requireSupabase()
  const { error } = await client.auth.updateUser({ password: newPassword })
  if (error) throw error

  const { data: userData } = await client.auth.getUser()
  if (!userData.user) throw new Error('Not signed in')

  const { error: profileError } = await client
    .from('profiles')
    .update({ must_change_password: false })
    .eq('id', userData.user.id)
  if (profileError) throw profileError
}

export async function signOut() {
  await requireSupabase().auth.signOut()
}

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await requireSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data as Profile | null
}

export async function listAllProfiles(): Promise<Profile[]> {
  const { data, error } = await requireSupabase().from('profiles').select('*').order('full_name')
  if (error) throw error
  return data as Profile[]
}

export { supabase }
