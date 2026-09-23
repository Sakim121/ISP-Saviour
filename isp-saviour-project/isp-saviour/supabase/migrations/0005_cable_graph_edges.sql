-- ============================================================================
-- ISP SAVIOUR — Phase 5 (part 1): Cable graph edges
--
-- WHY THIS CHANGE: the Fiber Cut / Fault Tracing algorithm needs to walk the
-- real network hierarchy "ONU -> Splitter -> Coupler -> PON Port -> OLT".
-- Phase 3's `cables` table only had `source_olt_id` (a loose "which OLT is
-- this generally under" tag) — nothing recorded which two specific nodes a
-- cable connects. Without that, there is no graph to walk.
--
-- `from_node_id` / `to_node_id` are added as the precise graph edge
-- endpoints. `source_olt_id` is left untouched for backward compatibility
-- with the Phase 3 UI/queries that already use it.
-- ============================================================================

alter table public.cables
  add column if not exists from_node_id uuid references public.nodes (id) on delete set null,
  add column if not exists to_node_id uuid references public.nodes (id) on delete set null;

create index if not exists cables_from_node_idx on public.cables (from_node_id);
create index if not exists cables_to_node_idx on public.cables (to_node_id);

-- ----------------------------------------------------------------------------
-- rpc_save_cable — recreated with two new optional parameters.
-- Postgres requires DROP + CREATE (not just CREATE OR REPLACE) when a
-- function's parameter list changes.
-- ----------------------------------------------------------------------------

drop function if exists public.rpc_save_cable(uuid, text, text, text, text, jsonb);

create or replace function public.rpc_save_cable(
  p_source_olt_id uuid,
  p_pon_port text,
  p_core_capacity text,
  p_core_color text,
  p_manufacturer text,
  p_geojson jsonb,
  p_from_node_id uuid default null,
  p_to_node_id uuid default null
)
returns public.cables
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.cables;
begin
  insert into public.cables (
    source_olt_id, pon_port, core_capacity, core_color, manufacturer, coordinates,
    from_node_id, to_node_id
  )
  values (
    p_source_olt_id,
    p_pon_port,
    p_core_capacity,
    p_core_color,
    p_manufacturer,
    ST_SetSRID(ST_GeomFromGeoJSON(p_geojson::text), 4326),
    p_from_node_id,
    p_to_node_id
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.rpc_save_cable(uuid, text, text, text, text, jsonb, uuid, uuid)
  to anon, authenticated;

-- ----------------------------------------------------------------------------
-- rpc_fetch_cables — now also returns the graph edge endpoints.
-- ----------------------------------------------------------------------------

create or replace function public.rpc_fetch_cables()
returns table (
  id uuid,
  source_olt_id uuid,
  pon_port text,
  core_capacity text,
  core_color text,
  manufacturer text,
  from_node_id uuid,
  to_node_id uuid,
  geometry jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.source_olt_id,
    c.pon_port,
    c.core_capacity,
    c.core_color,
    c.manufacturer,
    c.from_node_id,
    c.to_node_id,
    ST_AsGeoJSON(c.coordinates)::jsonb as geometry,
    c.created_at
  from public.cables c;
$$;

grant execute on function public.rpc_fetch_cables() to anon, authenticated;
