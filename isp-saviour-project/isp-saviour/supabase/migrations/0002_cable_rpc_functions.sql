-- ============================================================================
-- ISP SAVIOUR — Phase 3: Cable GeoJSON <-> PostGIS bridge functions
--
-- Because `cables.coordinates` is a PostGIS geometry column, the frontend
-- can't just supabase.from('cables').insert({ coordinates: geojson }) — the
-- PostgREST layer doesn't do that conversion for you. These two functions
-- are the single place that conversion happens, so src/lib/mapApi.js only
-- ever deals in plain GeoJSON.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- rpc_save_cable — insert a new cable from a drawn Leaflet polyline.
-- p_geojson is the `geometry` object of a GeoJSON LineString Feature, e.g.
--   { "type": "LineString", "coordinates": [[lng,lat],[lng,lat], ...] }
-- ----------------------------------------------------------------------------

create or replace function public.rpc_save_cable(
  p_source_olt_id uuid,
  p_pon_port text,
  p_core_capacity text,
  p_core_color text,
  p_manufacturer text,
  p_geojson jsonb
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
    source_olt_id, pon_port, core_capacity, core_color, manufacturer, coordinates
  )
  values (
    p_source_olt_id,
    p_pon_port,
    p_core_capacity,
    p_core_color,
    p_manufacturer,
    ST_SetSRID(ST_GeomFromGeoJSON(p_geojson::text), 4326)
  )
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.rpc_save_cable(uuid, text, text, text, text, jsonb)
  to anon, authenticated;

-- ----------------------------------------------------------------------------
-- rpc_fetch_cables — return every cable with its geometry already converted
-- back to GeoJSON, ready for react-leaflet's <Polyline positions={...} />.
-- ----------------------------------------------------------------------------

create or replace function public.rpc_fetch_cables()
returns table (
  id uuid,
  source_olt_id uuid,
  pon_port text,
  core_capacity text,
  core_color text,
  manufacturer text,
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
    ST_AsGeoJSON(c.coordinates)::jsonb as geometry,
    c.created_at
  from public.cables c;
$$;

grant execute on function public.rpc_fetch_cables() to anon, authenticated;
