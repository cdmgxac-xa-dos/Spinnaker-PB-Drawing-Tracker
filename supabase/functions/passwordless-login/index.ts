// Supabase Edge Function: passwordless-login
//
// Per the spec, only the XA Admin / Site Engineer account is password
// protected (default "000000", forced change on first login). Everyone
// else is passwordless, but not identically:
//
// - Draftsman / DAAA / GPI: a real magic-link email that must actually be
//   opened and clicked. Their actions are attributed and audited (who
//   assigned/approved/reviewed what), so this has to actually prove it's
//   them — see the "what stops someone else from picking my name" gap
//   this closes. The browser only ever learns "sent", never a token.
//
// - Landco: instant click-to-login, no email round-trip. They're pure
//   read-only viewers — nothing they do is attributed or audited, and the
//   exact data they see is already public at /client with no login at
//   all. So the real-email-click requirement added no actual security for
//   this role, while corporate email security scanners (Microsoft Safe
//   Links, Google's link proxy, etc.) auto-click and burn the one-time
//   link before the real person opens it — a real, observed failure for
//   a landco.ph account. Reverting this one role to instant login
//   sidesteps that entirely.
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

    if (profile.role === 'landco') {
      return await instantLogin(profile)
    }
    return await sendMagicLinkEmail(profile)
  } catch (err) {
    return json({ error: err instanceof Error ? err.message : 'Unexpected error' }, 500)
  }
})

// Landco: generate a magic-link OTP and redeem it immediately server-side,
// returning a real session directly — no email round-trip at all.
async function instantLogin(profile: { email: string; full_name: string; role: string }) {
  const linkRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
    method: 'POST',
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type: 'magiclink', email: profile.email }),
  })
  const link = await linkRes.json()
  if (!linkRes.ok) {
    return json({ error: link?.msg ?? link?.error_description ?? 'Could not start sign-in' }, 500)
  }
  const otp = link.email_otp
  if (!otp) {
    return json({ error: 'Could not generate a sign-in token' }, 500)
  }

  const verifyRes = await fetch(`${SUPABASE_URL}/auth/v1/verify`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'magiclink', email: profile.email, token: otp }),
  })
  const session = await verifyRes.json()
  if (!verifyRes.ok || !session.access_token) {
    return json({ error: session?.msg ?? session?.error_description ?? 'Sign-in failed' }, 500)
  }

  return json({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    full_name: profile.full_name,
    role: profile.role,
  })
}

// Draftsman / DAAA / GPI: trigger Supabase's own magic-link email. The
// browser gets back only confirmation it was sent — no token, no email.
async function sendMagicLinkEmail(profile: { email: string; full_name: string }) {
  const otpRes = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
    method: 'POST',
    headers: { apikey: ANON_KEY, 'Content-Type': 'application/json' },
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
  return json({ sent: true, full_name: profile.full_name })
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
