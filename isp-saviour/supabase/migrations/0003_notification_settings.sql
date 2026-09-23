-- ============================================================================
-- ISP SAVIOUR — Phase 4: Notification Settings
--
-- NOTE ON NAMING: the Phase 4 spec asks for exactly three preference values
-- ("Send all logs" / "Only Wire Down" / "Mute Notifications"), which is a
-- different set of labels than Phase 1's already-built /admin/notifications
-- "Event Trigger" dropdown ("Only Wire Down" / "Power Off & Wire Down" /
-- "All Events"). Per the project's own rule against silently changing
-- specified dropdown values, this table stores the Phase-4-worded values
-- (below) as its own separate, functional control — Phase 1's original
-- dropdown is left untouched. See the Notifications.jsx page for how both
-- are shown together with this distinction explained in the UI.
-- ============================================================================

do $$
begin
  if not exists (select 1 from pg_type where typname = 'notification_preference') then
    create type notification_preference as enum ('all_logs', 'only_wire_down', 'muted');
  end if;
end $$;

create table if not exists public.notification_settings (
  id          uuid primary key default gen_random_uuid(),
  preference  notification_preference not null default 'only_wire_down',
  updated_at  timestamptz not null default now()
);

-- Single-row settings table: seed exactly one row so the UI always has
-- something to read/update. (If you need per-user preferences later, this
-- table would need a user_id column and RLS scoped to auth.uid() instead.)
insert into public.notification_settings (preference)
select 'only_wire_down'
where not exists (select 1 from public.notification_settings);

drop trigger if exists trg_notification_settings_updated_at on public.notification_settings;
create trigger trg_notification_settings_updated_at
  before update on public.notification_settings
  for each row execute function public.set_updated_at();

-- Permissive RLS for now — see the note in migration 0001 and
-- supabase/README.md. Tightened in Phase 8.
alter table public.notification_settings enable row level security;
drop policy if exists "dev_allow_all_notification_settings" on public.notification_settings;
create policy "dev_allow_all_notification_settings" on public.notification_settings
  for all using (true) with check (true);
