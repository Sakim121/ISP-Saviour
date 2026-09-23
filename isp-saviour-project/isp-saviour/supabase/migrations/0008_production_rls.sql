-- ============================================================================
-- ISP SAVIOUR — Phase 8.3: Production RLS
--
-- Replaces the permissive "allow all" dev policies from migrations 0001/0003
-- with real rules:
--   - READ: open to everyone (including anonymous visitors) — the public
--     map/status view keeps working exactly as it has since Phase 2/3.
--   - WRITE (insert/update/delete): requires a signed-in user whose
--     `profiles.role` is technician-tier or above.
--
-- This requires an actual authenticated user to exist, which no prior phase
-- built — see the `profiles` table and auto-provisioning trigger below, and
-- src/lib/AuthContext.jsx / src/pages/Login.jsx on the frontend. There is no
-- self-signup flow: create accounts via Supabase Dashboard -> Authentication,
-- then assign a role by hand (see supabase/DEPLOYMENT.md).
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Roles + profiles
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum (
      'super_admin', 'admin', 'support_staff', 'field_technician', 'viewer'
    );
  end if;
end $$;

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  role        user_role not null default 'viewer',
  created_at  timestamptz not null default now()
);

-- New auth.users signups get a profile row automatically (defaulting to the
-- lowest-privilege 'viewer' role — an admin must manually upgrade a
-- technician's role afterward, see supabase/DEPLOYMENT.md).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, role) values (new.id, 'viewer');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);

-- ----------------------------------------------------------------------------
-- Helper: is the given user technician-tier or above?
-- ----------------------------------------------------------------------------

create or replace function public.is_technician(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = p_user_id
      and role in ('super_admin', 'admin', 'support_staff', 'field_technician')
  );
$$;

-- ----------------------------------------------------------------------------
-- nodes — replace the Phase 3 dev-open policy
-- ----------------------------------------------------------------------------

drop policy if exists "dev_allow_all_nodes" on public.nodes;

drop policy if exists "nodes_select_public" on public.nodes;
create policy "nodes_select_public" on public.nodes
  for select using (true);

drop policy if exists "nodes_write_technicians" on public.nodes;
create policy "nodes_write_technicians" on public.nodes
  for insert with check (public.is_technician(auth.uid()));

drop policy if exists "nodes_update_technicians" on public.nodes;
create policy "nodes_update_technicians" on public.nodes
  for update using (public.is_technician(auth.uid())) with check (public.is_technician(auth.uid()));

drop policy if exists "nodes_delete_technicians" on public.nodes;
create policy "nodes_delete_technicians" on public.nodes
  for delete using (public.is_technician(auth.uid()));

-- ----------------------------------------------------------------------------
-- cables — same pattern
-- ----------------------------------------------------------------------------

drop policy if exists "dev_allow_all_cables" on public.cables;

drop policy if exists "cables_select_public" on public.cables;
create policy "cables_select_public" on public.cables
  for select using (true);

drop policy if exists "cables_write_technicians" on public.cables;
create policy "cables_write_technicians" on public.cables
  for insert with check (public.is_technician(auth.uid()));

drop policy if exists "cables_update_technicians" on public.cables;
create policy "cables_update_technicians" on public.cables
  for update using (public.is_technician(auth.uid())) with check (public.is_technician(auth.uid()));

drop policy if exists "cables_delete_technicians" on public.cables;
create policy "cables_delete_technicians" on public.cables
  for delete using (public.is_technician(auth.uid()));

-- ----------------------------------------------------------------------------
-- notification_settings — NOT explicitly named in the Phase 8.3 spec (which
-- only listed nodes/cables), but left wide-open here would be an obvious
-- gap sitting right next to two newly-locked-down tables: anyone could mute
-- Telegram alerts. Applying the identical read-open/write-technician pattern
-- for consistency — flagged here rather than left silent, per this
-- project's own rule about not making unrequested changes without saying so.
-- ----------------------------------------------------------------------------

drop policy if exists "dev_allow_all_notification_settings" on public.notification_settings;

drop policy if exists "notification_settings_select_public" on public.notification_settings;
create policy "notification_settings_select_public" on public.notification_settings
  for select using (true);

drop policy if exists "notification_settings_write_technicians" on public.notification_settings;
create policy "notification_settings_write_technicians" on public.notification_settings
  for update using (public.is_technician(auth.uid())) with check (public.is_technician(auth.uid()));

-- ----------------------------------------------------------------------------
-- IMPORTANT: rpc_snmp_upsert_onu (Phase 6/7) is SECURITY DEFINER and is
-- called by the Node.js scanners using the service_role key, which bypasses
-- RLS entirely — the policies above do not affect it. No change needed
-- there.
-- ----------------------------------------------------------------------------
