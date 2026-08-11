# Client Shop Drawing Transparency Tracker

A standalone web app that turns the client's Excel shop-drawing/BOM tracking
sheet into a live dashboard: XA manages the workflow, draftsmen update
assigned tasks, DAAA and GPI review and approve, and the client watches
progress in real time. **This is not part of XA DOS** — separate app,
separate repository, separate Supabase project.

Built against `Client_Shop_Drawing_Transparency_Tracker_MD_File_v1.1` with
Supabase (Postgres + Auth + Storage) in place of the spec's suggested
Google Sheets/Drive backend, per request.

## Tech stack

React 18 + Vite + TypeScript + Tailwind CSS + React Router + Supabase JS
v2 + one Supabase Edge Function (passwordless sign-in) + `xlsx` for
re-importing the register from Excel.

## Roles & permissions

Implements the spec's permission matrix exactly (see `supabase/02_functions.sql`
— every mutation is a `SECURITY DEFINER` RPC that checks the caller's role
and the drawing's current status before doing anything; direct table writes
are locked down to XA via RLS):

| Action | XA | Draftsman | DAAA | GPI |
|---|---|---|---|---|
| View drawings / PDFs / audit history | ✅ | ✅ (own) | ✅ | ✅ |
| Import Excel / create / edit / delete item | ✅ | – | – | – |
| Assign draftsman, set target date | ✅ | – | – | – |
| Upload / replace PDF | ✅ | ✅ (own, while drafting) | – | – |
| Submit to DAAA | ✅ | – | – | – |
| Approve / request revision (with comments) | – | – | ✅ | ✅ |
| Reject | – | – | – | ✅ |

Status workflow (all 10 spec statuses): Not Started → Assigned → Drafting →
Internal Review → Submitted to DAAA → DAAA Review → GPI Review → Approved →
Completed, with Revision Required looping back to a reassigned Draftsman
(the drawing's `revision_number` increments each time).

A fifth role, **Landco** (the project owner — see `OWNER:` in the source
Excel), sits outside this matrix entirely: view-only, not part of the
workflow. RLS blocks Landco from `drawing_items`/`drawing_pdfs`/
`review_history` directly (`supabase/05_landco_permissions.sql`) — they
only ever read the same curated `client_dashboard_*` views the public
dashboard uses, just behind a login instead of a public link.

## Login

- **XA Admin / Site Engineer** — password-protected. The very first one is
  created from the login screen itself (shows "Set up the first Admin
  account" until one exists) with password **`000000`**, and the app forces
  a password change immediately after that first sign-in. Any additional
  XA Admin accounts XA creates from **Users** also start at `000000` with a
  forced change.
- **Draftsman / DAAA / GPI / Landco** — no password. The login screen
  lists accounts by role; picking a name signs you in directly. Under the
  hood this still produces a real, RLS-respecting Supabase session — see
  "Passwordless sign-in" below.
- **Client Transparency Dashboard** (`/client`) — fully public, no login,
  read-only, identical data to what Landco sees logged in. Shows progress,
  status, dates, approved PDFs and a workflow timeline; never shows
  drawings that aren't yet Approved/Completed, and never shows internal
  remarks (only formal submission/review events).

### Passwordless sign-in, and why it needs an Edge Function

Supabase Auth sessions can only be minted by the Auth server — there's no
way for a plain SQL function to hand back a valid session. So "no password"
for Draftsman/DAAA/GPI is implemented as: the login screen calls the
`passwordless-login` Edge Function with the chosen account's id; the
function (using the service-role key, server-side only) generates a
magic-link OTP for that account's email and immediately redeems it, then
returns the resulting access/refresh tokens to the browser, which installs
them with `supabase.auth.setSession()`. No password exists for these
accounts at all, and nothing is ever emailed or shown.

## Setup

1. **Create a Supabase project** (separate from any XA DOS project).
2. **Auth settings** — under Authentication → Providers → Email, turn
   **off** "Confirm email". Account creation in this app signs a brand-new
   user up and immediately writes their `profiles` row in the same request;
   if email confirmation is required, that user has no session yet and the
   profile insert will fail RLS. (Standard setting for internal/staff
   tools — nobody outside your org can reach the sign-up flow, since it's
   only ever called from the "Add account" screen.)
3. **Run the SQL**, in order, in the Supabase SQL Editor:
   - `supabase/01_schema.sql` — tables, enums, RLS, storage bucket + policies, public views
   - `supabase/02_functions.sql` — all workflow RPCs
   - `supabase/04_add_landco_role.sql` — adds the Landco (owner) role (must run alone, see the file header)
   - `supabase/05_landco_permissions.sql` — locks Landco to read-only curated views
   - `supabase/06_add_batch_column.sql` — adds the batch grouping level (e.g. "BATCH 1")
   - `supabase/07_batch1_register.sql` — preloads the register (see below)
   - `supabase/03_seed_register.sql` is **historical/superseded** — it seeded
     124 items from the ORIG sheet, which turned out not to match what's
     actually being tracked. Skip it on a fresh install; 07 is the current source.
4. **Deploy the Edge Function**:
   ```bash
   supabase login
   supabase link --project-ref <your-project-ref>
   supabase functions deploy passwordless-login
   ```
   `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` / `SUPABASE_ANON_KEY` are
   injected automatically — no secrets to set by hand.
5. **Configure the app**:
   ```bash
   cp .env.example .env.local   # fill in your project URL + anon key
   npm install
   npm run dev
   ```
6. Open the app, create the first XA Admin account, sign in with `000000`,
   set a real password, then use **Users** to add draftsmen/DAAA/GPI
   accounts (they need a real email address each — that's what the
   magic-link OTP under the passwordless flow authenticates against, even
   though nobody ever sees or types it).

## The preloaded register

`supabase/07_batch1_register.sql` preloads **45 items**, pulled from the
client Excel's **"Batch 1" tab only** (project: *The Spinnaker at Club
Laiya*, CP19 — Supply and Delivery of Panel Boards and Breakers, Meter
Center, kWh Meter & Switch Gear) — no other tab. Each item carries two
grouping levels, both shown in the Register and Client Dashboard:

- **Batch** — `"BATCH 1"` for every item here (the delivery/procurement
  batch this equipment belongs to; a future Batch 2 import would use its
  own batch label and appear as a separate top-level section).
- **Category** — the finer equipment-type grouping from the tab itself:
  Main Switchgear & Feeder Breakers, Admin Panelboards & Circuit Breakers,
  Busbar Gutter, Circuit Breaker Gutter, Enclosed Circuit Breaker (ECB),
  Residential Panelboards & Circuit Breakers.

An earlier version of this register was seeded from the `ORIG` sheet
(124 items) instead — that didn't match what's actually being tracked, so
it was replaced outright (`03_seed_register.sql` is kept for history only).
Switching sources meant `delete from drawing_items` before the Batch 1
insert, which cascades to `drawing_pdfs`/`review_history` — any
assignments/uploads against the old register were cleared as part of
this fix, confirmed intentional.

`supabase/batch1_items_v2.json` is the exact parsed data behind the seed,
kept for reconciliation. Two judgment calls made while parsing, in case
anyone checks against the original file:
- Items **1.0–4.0** and **9.0** sit above the tab's first named category
  row, so they're grouped under "Main Switchgear & Feeder Breakers".
  Items **6.0** and **7.0** are each a single-item "category" in the
  source (the group header row and the one item under it are the same
  row pair) — the header text became the category ("Busbar Gutter…" /
  "Circuit Breaker Gutter…") and the item's own name ("MCG") became the
  description.
- The source spreadsheet has two item numbers Excel stored as numbers and
  silently truncated (`8.10`→`8.1`, `10.10`→`10.1`, each colliding with an
  already-used number) — corrected back to `.10` based on sheet position.
- The sheet's own footer says "TOTAL QUANTITY = 146"; the 45 line items
  actually sum to 147. Left as counted (not adjusted) per request — worth
  reconciling against the source file directly.

XA can re-import at any time from **Drawing Register → Import Excel**
(expects columns `item_no`, `description`, `category`, `batch`,
`sheet_no`, `reference`, `unit`, `qty`) — it upserts by `item_no`.

## Project structure

```
src/
  components/   StatusBadge, DrawingListTable, PdfPanel, Timeline, StatCard
  context/      AuthContext
  layouts/      AppLayout (role-aware top nav)
  pages/        Login, ChangePassword, RoleHome (dashboard/queues per role),
                DrawingRegister, DrawingDetail, Users, ClientDashboard
  routes/       ProtectedRoute (auth + must-change-password + role gating)
  services/     authService, drawingService, pdfService, clientDashboardService
  types/        Domain model — mirrors the SQL schema exactly
supabase/
  01_schema.sql, 02_functions.sql — core schema + RPCs
  03_seed_register.sql — historical/superseded (ORIG-sheet seed)
  04_add_landco_role.sql, 05_landco_permissions.sql — Landco (owner) role
  06_add_batch_column.sql, 07_batch1_register.sql — current register (Batch 1)
  functions/passwordless-login/index.ts
```

## Note on this build

Written in a sandboxed environment with no live Supabase project to test
against — `npm install`, `tsc -b` and `vite build` all run clean here, but
please run the SQL + Edge Function deploy against a real project and open
an issue (or just tell me) if anything doesn't line up; I'll fix it
immediately.
