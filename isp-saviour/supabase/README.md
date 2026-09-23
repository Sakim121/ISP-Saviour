# Supabase — ISP Saviour

## Applying the schema

### Option A — SQL Editor (quickest, no CLI needed)

1. Open your Supabase project → **SQL Editor**.
2. Paste the contents of `migrations/0001_init_schema.sql`, run it.
3. Paste the contents of `migrations/0002_cable_rpc_functions.sql`, run it.

Run them in that order — the second file's functions reference the
`cables` table created in the first.

### Option B — Supabase CLI

```bash
supabase login
supabase link --project-ref <your-project-ref>
supabase db push
```

## After applying

1. Go to **Table Editor** and confirm `nodes` and `cables` exist.
2. Go to **Database → Replication** and confirm `nodes` and `cables` are
   listed under the `supabase_realtime` publication (the migration adds them
   automatically, but it's worth checking — some Supabase plans require this
   to be enabled per-table in the dashboard UI as well).
3. Go to **Project Settings → API** and copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`
4. In the app root, copy `.env.example` to `.env.local` and paste those two
   values in.
5. Restart `npm run dev`.

## Geometry decision (read before changing anything here)

`cables.coordinates` is a PostGIS `geometry(LineString, 4326)` column, not a
JSONB array of points. This was a deliberate choice (not a default) because
Phase 5's Fiber Cut / Fault Tracing algorithm needs real geometric
intersection queries (`ST_Intersects`, `ST_ClosestPoint`,
`ST_LineLocatePoint`, `ST_Distance`) that are far simpler and more accurate
to run in SQL against a spatial index than to reimplement in JavaScript.

The trade-off: the frontend can't insert/read this column directly through
PostgREST's normal `.insert()`/`.select()`. Two RPC functions bridge that:

- `rpc_save_cable(...)` — takes a plain GeoJSON `geometry` object and
  converts it to PostGIS geometry on insert.
- `rpc_fetch_cables()` — returns every cable with its geometry already
  converted back to GeoJSON.

`src/lib/mapApi.js` calls these two functions so the rest of the React app
never has to know PostGIS exists.

If this project ever needs to drop PostGIS (e.g. a hosting constraint), the
migration to change would be: alter `cables.coordinates` to `jsonb`, drop the
two RPC functions, and change `mapApi.js`'s `saveNewCable`/`fetchMapData` to
plain `.insert()`/`.select()` calls storing/reading a raw GeoJSON object. The
Phase 5 fault-tracing algorithm would then need to do its intersection math
client-side (e.g. with Turf.js) instead of in a PL/pgSQL function.

## Phase 4 setup — Telegram Alerts

### 1. Run the two new migrations (in order, after 0001/0002)

Via SQL Editor: paste and run `migrations/0003_notification_settings.sql`,
then `migrations/0004_telegram_trigger.sql`.

`0004` enables the `pg_net` and `supabase_vault` extensions — both are
built into Supabase, no extra installation needed.

### 2. Deploy the Edge Function

```bash
supabase functions deploy telegram-alert
```

Do **not** pass `--no-verify-jwt`. Leaving JWT verification on (the
default) is what makes "only the database trigger can call this" actually
true — see the comment block at the top of
`supabase/functions/telegram-alert/index.ts`.

### 3. Set the Edge Function's Telegram secrets

```bash
supabase secrets set TELEGRAM_BOT_TOKEN="<your bot token from @BotFather>" \
  TELEGRAM_CHAT_ID="<your chat or group id>"
```

### 4. Store the two Vault secrets the DB trigger needs

These are **not** environment variables — they're read out of Postgres
itself via Supabase Vault. Run this once in the SQL Editor, filling in your
own project ref and service role key:

```sql
select vault.create_secret(
  'https://<your-project-ref>.supabase.co/functions/v1/telegram-alert',
  'telegram_edge_function_url'
);

select vault.create_secret(
  '<paste your service_role key here — Project Settings -> API -> service_role secret>',
  'service_role_key'
);
```

⚠️ The service role key bypasses RLS entirely. Never put it in frontend
code or commit it to git — this SQL command is the only place it should be
pasted, and it's stored encrypted by Vault.

### 5. Test it

In the Table Editor, manually change any row in `nodes` so its `status`
column becomes `wire_down` (or `offline`, if the notification preference is
set to "Send all logs" — see the Notifications page). Within a few seconds
you should receive a message in the configured Telegram chat like:

```
🚨 NETWORK ALERT:
ONU 'healthcare2' is WIRE DOWN!
```

If nothing arrives, check: Edge Function logs (`supabase functions logs
telegram-alert`), that both Vault secrets exist
(`select * from vault.decrypted_secrets;` in the SQL Editor), and that
`TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` are set correctly.

### Telegram endpoint correction

The project brief specified `https://telegram.org<token>/sendMessage` as
the Telegram API URL. That is not a real Telegram Bot API endpoint. The
Edge Function uses the actual official endpoint instead:

```
https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage
```

This is documented at https://core.telegram.org/bots/api#sendmessage. This
substitution is called out here (and inline in the Edge Function code)
rather than made silently, per the project's verification rules.

## Phase 5 setup — Fault Tracing

### 1. Run the three new migrations (in order, after 0001-0004)

Via SQL Editor: paste and run, in this order:
- `migrations/0005_cable_graph_edges.sql`
- `migrations/0006_fault_tracing_functions.sql`

These add `cables.from_node_id`/`to_node_id` and two functions:
`get_node_path_to_olt()` (recursive tree walk, satisfies spec 5.2) and
`trace_fiber_fault()` (the fault-localization algorithm, spec 5.1).

### 2. (Optional) Load a demo topology to test against

The algorithm needs cables with `from_node_id`/`to_node_id` set to have
anything to trace. If you haven't drawn a real topology on the map yet, run
`seed/phase5_demo_topology.sql` once in the SQL Editor — it creates a small
OLT → Splitter → 3 ONUs tree (2 of them wire-down) specifically shaped to
exercise every part of the algorithm. Its header comment explains exactly
what result to expect.

### 3. Building a real topology (once you're past the demo)

For the algorithm to work on your own data, every cable you draw on
`/dashboard/map` needs its "Connects From" / "Connects To" fields filled in
(the Add Fiber Cable modal) — pick the actual upstream and downstream
nodes, not just the generic "Source OLT" field. A cable with no from/to
link is invisible to `get_node_path_to_olt()`.

## RLS status (temporary)

Both tables have Row Level Security **enabled** with a permissive
"allow all" policy — enough to build and test against, but not secure.
Phase 8 replaces these two policies with the real authenticated-write /
public-read rules. Do not deploy this schema to a public production project
as-is.
