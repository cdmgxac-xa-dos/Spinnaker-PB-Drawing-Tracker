// Supabase Edge Function: passwordless-login
//
// Per the spec, only the XA Admin / Site Engineer account is password
// protected (default "000000", forced change on first login). Draftsman,
// DAAA, GPI and Landco accounts need "no password required" — but that
// must still prove it's really them, not just anyone with the login link
// clicking their name (see the "what stops someone else from picking my
// name" gap this replaces the fix for).
//
// This function is the bridge: given a profile id, it looks up that
// account's real email server-side (service role — the email is never
// sent to the browser) and triggers Supabase's own magic-link email via
// the standard /auth/v1/otp endpoint. The browser never receives a token
// or a session here — it only finds out "the email was sent." The actual
// session only gets created when the person opens their real inbox and
// clicks the link, which supabase-js on the app picks up automatically
// (detectSessionInUrl) when they land back on the site.
//
// Deliberately has zero external imports (plain fetch() to the REST/Auth
// HTTP API instead of @supabase/supabase-js) — this only needs to run
// through Deno's std runtime, no bundler/import resolution required.
//
// Deploy with:
//   supabase functions deploy passwordless-login
// (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SUPABASE_ANON_KEY are
// injected automatically by the Supabase platform — no extra secrets.)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Must be present in the project's Auth > URL Configuration redirect
// allow-list, or GoTrue silently falls back to the default Site URL.
const SITE_URL = 'https://spinnaker-drawing-tracker.netlify.app/'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { profile_id } = await req.json()
    if (!profile_id) {
      return json({ error: 'profile_id is required' }, 400)
    }

    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${encodeURIComponent(profile_id)}&select=id,email,role,full_name`,
      {
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        },
      }
    )
    if (!profileRes.ok) {
      return json({ error: 'Could not look up account' }, 500)
    }
    const profiles = await profileRes.json()
    const profile = profiles?.[0]
    if (!profile) {
      return json({ error: 'Account not found' }, 404)
    }
    if (profile.role === 'xa_admin') {
      return json({ error: 'XA Admin / Site Engineer accounts require a password' }, 403)
    }

    const otpRes = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        apikey: ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.email,
        create_user: false,
        options: { email_redirect_to: SITE_URL },
      }),
    })
    if (!otpRes.ok) {
      const body = await otpRes.json().catch(() => ({}))
      return json({ error: body?.msg ?? body?.error_description ?? 'Could not send sign-in email' }, 500)
    }

    // Deliberately no tokens, no email address — just confirmation it was sent.
    return json({ sent: true, full_name: profile.full_name })
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
