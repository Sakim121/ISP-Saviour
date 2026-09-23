# ISP Saviour

A fiber-network operations dashboard: live map, OLT/PON management, fiber
cut fault tracing, Telegram alerting, and SNMP-driven auto-sync from real
OLT hardware. Built phase-by-phase; each phase's own README has full setup/
test details. This file is the top-level index plus the final,
human-executed go-live checklist (Phase 9).

## Repo layout

```
isp-saviour/              ← the web app (React + Vite + Tailwind + Leaflet + Supabase)
  README.md               ← Phases 1-5 & 8 setup/testing, one section per phase
  supabase/
    migrations/            ← 0001-0008, apply in order (see supabase/DEPLOYMENT.md)
    functions/telegram-alert/
    seed/                  ← optional demo data
    README.md              ← Supabase-specific setup notes per phase
    DEPLOYMENT.md          ← Phase 8.2: full ordered production deployment checklist

snmp-scanner/              ← Phase 6: generic, multi-brand SNMP poller (background process)
vsol-v1600d8-scanner/      ← Phase 7: VSOL V1600D8-specific SNMP poller (background process)
```

The two scanner folders are **not** deployed to Vercel/Netlify — they're
long-running background scripts you run on a machine with network access
to your OLTs (a small on-prem box, a VPS on the same LAN/VPN, etc.).

## Phase 9 — Manual Deployment Actions

Everything below is something a human clicks/types once, in order, to take
this from a local checkout to a live production system. Nothing here is
new code — it's the sequence that wires together Phases 1-8.

### 1. GitHub Repository

```bash
git init
git add .
git commit -m "ISP Saviour — initial commit"
git branch -M main
git remote add origin <your-private-repo-url>
git push -u origin main
```

Push this **entire folder** (all three subfolders) as one private repo —
keeping `isp-saviour/`, `snmp-scanner/`, and `vsol-v1600d8-scanner/`
together in one place makes it much easier to keep the frontend and the
scanners' assumptions (schema, `external_id` format, etc.) in sync as the
project evolves. Confirm the repo is set to **Private** before pushing —
it will contain no real secrets (all `.env.example`/`.env.production` are
templates), but there's no reason to make it public either.

### 2. Supabase Production Setup

Follow `isp-saviour/supabase/DEPLOYMENT.md` in full before touching Vercel
— the frontend needs a live, migrated Supabase project to point at.
Short version: create the project, `supabase link`, `supabase db push`
(applies all 8 migrations), store the two Vault secrets, deploy the
`telegram-alert` function, set its secrets, then create + promote your
first technician account.

### 3. Vercel Deployment

1. Connect your GitHub account to Vercel (if not already).
2. **Import Project** → select this repo.
3. Because this is a monorepo, set **Root Directory** to `isp-saviour`
   (Project Settings → General → Root Directory) — otherwise Vercel will
   try to build the repo root, which has no `package.json`.
4. Framework Preset: **Vite** (should auto-detect once Root Directory is set).
5. Environment Variables (Project Settings → Environment Variables):
   | Key | Value |
   |---|---|
   | `VITE_SUPABASE_URL` | your production Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | your production anon public key |
6. Deploy. `isp-saviour/vercel.json` (already in the repo) handles SPA
   routing automatically — no extra config needed:
   ```json
   {
     "rewrites": [
       { "source": "/(.*)", "destination": "/index.html" }
     ]
   }
   ```

*(Using Netlify instead? Same idea — set the base directory to
`isp-saviour` in Site settings, and `netlify.toml` there already has the
build command/publish dir/SPA redirect configured.)*

### 4. Supabase Telegram Secrets

If you haven't already (step 2 covers this, repeated here since it's easy
to forget when jumping straight to Vercel):

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="your_token" TELEGRAM_CHAT_ID="your_chat_id"
```

These are required for live Telegram bot notifications (Phase 4) — without
them, `telegram-alert` will log an error and return a 500 rather than
sending anything, but nothing else breaks.

### 5. OLT Connection Architecture

This is the piece that lives outside Vercel/Supabase entirely — a small
always-on process near your actual network hardware:

```
[ OLT (Netlink / VSOL / Syrotech) ]
              │
              │ SNMP Read
              │ No Config Needed
              ▼
[ Node.js Lightweight Script ]         <- snmp-scanner/ (Phase 6) or
              │                           vsol-v1600d8-scanner/ (Phase 7)
              │ Runs 24 Hours
              │
              │ Secure API Request (service_role key)
              ▼
[ Supabase Database ]
              │
              ▼
[ Live Vercel Frontend Map ]           <- realtime subscription, no polling needed
```

Run this on a machine that can actually reach your OLT's management IP
(most OLTs are on a private management VLAN, not the public internet) —
typically a small on-site box, or a VPS connected via VPN/site-to-site
tunnel into that network. See each scanner's own README for PM2 setup so
it survives reboots.

## Go-live checklist

- [ ] Supabase production project created, all 8 migrations applied
- [ ] Vault secrets set (`telegram_edge_function_url`, `service_role_key`)
- [ ] `telegram-alert` function deployed + its two secrets set
- [ ] First technician account created and promoted (not left as `viewer`)
- [ ] Frontend deployed (Vercel or Netlify), env vars set, Root Directory correct
- [ ] Visiting the deployed URL directly at a deep route (e.g. `/dashboard/map`) does NOT 404
- [ ] Anonymous visitor can view the map; cannot save a new marker/cable (RLS working)
- [ ] Signed-in technician CAN save a new marker/cable
- [ ] At least one SNMP scanner running against a real OLT (or paused/skipped if no hardware yet)
- [ ] Manually flipping a node to `wire_down` in the DB produces a Telegram message
- [ ] GitHub repo is private, no real secrets committed anywhere in git history

## Summary of decisions flagged during the build (for final review)

These were called out explicitly, in place, as they came up — collected
here as one list so nothing gets missed on a final pass:

1. **PostGIS over JSONB** for `cables.coordinates` (Phase 3) — required by
   Phase 5's fault-tracing geometry queries. Full trade-off in
   `isp-saviour/supabase/README.md`.
2. **Telegram endpoint corrected** (Phase 4) — the brief's
   `https://telegram.org<token>/sendMessage` is not a real endpoint; using
   the actual `https://api.telegram.org/bot<token>/sendMessage`.
3. **Notification Settings wording** (Phase 4) — Phase 1's dropdown and
   Phase 4's functional toggle use different option labels from the brief
   itself; both are kept, side by side, rather than one silently overwriting
   the other.
4. **`cables.from_node_id`/`to_node_id` added** (Phase 5) — Phase 3's
   schema had no graph edges to trace; required for fault localization.
5. **`nodes.external_id` + safe-upsert RPC added** (Phase 6) — a plain
   generic upsert would have clobbered manually-placed node names/GPS on
   every SNMP scan cycle.
6. **Login/Auth added** (Phase 8) — not its own phase in the brief, but a
   hard prerequisite for "authenticated technicians can write" to be
   checkable at all; no self-signup, accounts are admin-provisioned.
7. **`notification_settings` RLS tightened alongside `nodes`/`cables`**
   (Phase 8) — one table beyond the literal spec, to avoid leaving alert
   muting wide open next to two newly-locked-down tables.
8. **OID verification** (Phases 6/7) — all SNMP OIDs are the brief's
   specified/best-known values, explicitly flagged as unverified against
   physical hardware; each scanner's README has the exact `snmpwalk`
   commands to confirm them.
9. **CORS** (Phase 8) — Supabase's hosted REST API has no per-project CORS
   restriction by design (RLS is the real boundary); this is explained
   rather than papered over with a config that wouldn't actually do anything.
