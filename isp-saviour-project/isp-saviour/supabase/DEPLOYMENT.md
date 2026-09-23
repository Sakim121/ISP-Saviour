# ISP Saviour — Supabase Production Deployment (Phase 8.2)

This consolidates every migration/function/secret across Phases 3-8 into
one ordered deployment checklist for a fresh production Supabase project.
(If you've been applying migrations phase-by-phase as you went, you're
likely already caught up — this is mainly for a clean/new environment.)

## 1. Create the project

Create a new Supabase project (choose a region close to your users/OLTs).
Production tip: use a **separate** Supabase project from whatever you used
for development — never point production secrets at a dev database.

## 2. Link the Supabase CLI

```bash
npm install -g supabase
supabase login
supabase link --project-ref <your-production-project-ref>
```

## 3. Apply all migrations, in order

```bash
supabase db push
```

This applies every file in `migrations/` in filename order:

| File | What it does |
|---|---|
| `0001_init_schema.sql` | `nodes`/`cables` tables, enums, PostGIS, dev RLS |
| `0002_cable_rpc_functions.sql` | GeoJSON ⇄ PostGIS bridge functions |
| `0003_notification_settings.sql` | Notification preference table |
| `0004_telegram_trigger.sql` | Telegram alert DB trigger |
| `0005_cable_graph_edges.sql` | Cable graph edges for fault tracing |
| `0006_fault_tracing_functions.sql` | Fault tracing algorithm |
| `0007_snmp_sync_support.sql` | Safe SNMP upsert function |
| `0008_production_rls.sql` | **Real RLS** — replaces all dev-open policies |

If you'd rather paste these into the SQL Editor by hand instead of using
the CLI, run them in this exact numeric order — several depend on tables/
functions created by earlier ones.

## 4. Store the Vault secrets (Phase 4's Telegram trigger needs these)

```sql
select vault.create_secret(
  'https://<your-project-ref>.supabase.co/functions/v1/telegram-alert',
  'telegram_edge_function_url'
);

select vault.create_secret(
  '<your production service_role key>',
  'service_role_key'
);
```

## 5. Deploy the Edge Function

```bash
supabase functions deploy telegram-alert
```

## 6. Set Edge Function secrets

```bash
supabase secrets set \
  TELEGRAM_BOT_TOKEN="<your bot token>" \
  TELEGRAM_CHAT_ID="<your chat id>"
```

## 7. Create your first technician account

There's no self-signup flow (by design — see Phase 8.3). Create the
account, then promote it:

1. Supabase Dashboard → **Authentication** → **Add user** → enter an email
   and password for yourself.
2. This auto-creates a matching row in `public.profiles` with
   `role = 'viewer'` (via the `handle_new_user` trigger in migration 0008).
3. Promote it in the SQL Editor:
   ```sql
   update public.profiles
   set role = 'super_admin'
   where id = (select id from auth.users where email = 'you@example.com');
   ```
4. You can now sign in at `/login` in the deployed frontend and draw/edit
   map data. Repeat step 1 + 3 (with an appropriate role) for each
   additional technician.

## 8. (Optional) Load demo data

- `seed/phase5_demo_topology.sql` — a small OLT/Splitter/ONU tree for
  testing Fault Tracing without drawing one by hand first.

## Verifying everything landed correctly

```sql
-- Tables exist
select table_name from information_schema.tables
where table_schema = 'public' order by table_name;

-- RLS is enabled and using the production policies, not the dev ones
select tablename, policyname, cmd from pg_policies
where schemaname = 'public' order by tablename, policyname;

-- Vault secrets are present (values are never shown, just confirms existence)
select name from vault.decrypted_secrets;
```
