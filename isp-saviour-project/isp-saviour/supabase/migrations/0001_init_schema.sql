-- ============================================================================
-- ISP SAVIOUR — Phase 3: Core Schema
-- Run this in the Supabase SQL Editor (or via `supabase db push`).
-- ============================================================================

-- PostGIS is required because `cables.coordinates` is stored as a geometry
-- LINESTRING (see the geometry-decision note in the project README / delivery
-- message for why this was chosen over a JSONB point array).
create extension if not exists postgis;

-- pgcrypto gives us gen_random_uuid() for primary keys.
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- ENUMS
-- ----------------------------------------------------------------------------

do $$
begin
  if not exists (select 1 from pg_type where typname = 'node_type') then
    create type node_type as enum ('olt', 'splitter', 'onu');
  end if;

  if not exists (select 1 from pg_type where typname = 'node_status') then
    create type node_status as enum ('online', 'offline', 'wire_down', 'power_off');
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- NODES TABLE — OLTs, Splitters, ONUs
-- ----------------------------------------------------------------------------

create table if not exists public.nodes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  type        node_type not null,
  status      node_status not null default 'offline',
  latitude    double precision not null,
  longitude   double precision not null,
  -- Free-form data that varies by node type: PPPoE username, RX dBm, etc.
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists nodes_type_idx on public.nodes (type);
create index if not exists nodes_status_idx on public.nodes (status);

-- ----------------------------------------------------------------------------
-- CABLES TABLE — Fiber routes
-- coordinates: PostGIS LINESTRING, SRID 4326 (standard lat/lng, matches
-- Leaflet/GeoJSON). See rpc_save_cable / rpc_fetch_cables in the next
-- migration for how the frontend reads/writes this without touching WKT.
-- ----------------------------------------------------------------------------

create table if not exists public.cables (
  id              uuid primary key default gen_random_uuid(),
  source_olt_id   uuid references public.nodes (id) on delete set null,
  pon_port        text,
  core_capacity   text,
  core_color      text,
  manufacturer    text,
  coordinates     geometry(LineString, 4326) not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists cables_source_olt_idx on public.cables (source_olt_id);
-- GiST spatial index — required for PostGIS functions (ST_Intersects, etc.)
-- used by the Phase 5 fault-tracing queries to run efficiently.
create index if not exists cables_coordinates_gix on public.cables using gist (coordinates);

-- ----------------------------------------------------------------------------
-- updated_at auto-touch trigger (shared by both tables)
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_nodes_updated_at on public.nodes;
create trigger trg_nodes_updated_at
  before update on public.nodes
  for each row execute function public.set_updated_at();

drop trigger if exists trg_cables_updated_at on public.cables;
create trigger trg_cables_updated_at
  before update on public.cables
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ROW LEVEL SECURITY
-- RLS is enabled here but left PERMISSIVE ("allow all") for Phase 3 so the
-- frontend can be built and tested without an auth flow yet. Phase 8
-- ("Security & Performance") replaces these two policies with the real
-- authenticated-write / public-read rules. Do not treat this as production
-- security — it is intentionally open for local development only.
-- ----------------------------------------------------------------------------

alter table public.nodes enable row level security;
drop policy if exists "dev_allow_all_nodes" on public.nodes;
create policy "dev_allow_all_nodes" on public.nodes
  for all using (true) with check (true);

alter table public.cables enable row level security;
drop policy if exists "dev_allow_all_cables" on public.cables;
create policy "dev_allow_all_cables" on public.cables
  for all using (true) with check (true);

-- ----------------------------------------------------------------------------
-- REALTIME
-- Required so subscribeToRealtimeChanges() in the frontend receives
-- postgres_changes events for these tables.
-- ----------------------------------------------------------------------------

alter publication supabase_realtime add table public.nodes;
alter publication supabase_realtime add table public.cables;
