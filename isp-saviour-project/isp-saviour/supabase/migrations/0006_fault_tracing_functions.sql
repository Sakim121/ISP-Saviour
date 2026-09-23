-- ============================================================================
-- ISP SAVIOUR — Phase 5 (part 2): Network Tree Query + Fault Tracing Algorithm
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 5.2 — get_node_path_to_olt(node_id)
-- Recursive CTE, wrapped in a SQL function, that walks a node's upstream
-- path (ONU -> Splitter -> ... -> OLT) via `cables.to_node_id` /
-- `from_node_id` edges. Returns one row per cable hop, ordered from the
-- node outward (hop 0 = the cable directly feeding this node) to the OLT.
--
-- This single function serves BOTH spec requirements:
--   - 5.2's "trace hierarchy from any node_id back to source OLT"
--   - 5.1's "Database Lookup: fetch the upstream path for affected ONUs"
-- ----------------------------------------------------------------------------

create or replace function public.get_node_path_to_olt(p_node_id uuid)
returns table (
  hop int,
  cable_id uuid,
  from_node_id uuid,
  to_node_id uuid,
  pon_port text,
  length_m double precision,
  geometry jsonb
)
language sql
stable
as $$
  with recursive walk as (
    select
      0 as hop,
      c.id as cable_id,
      c.from_node_id,
      c.to_node_id,
      c.pon_port,
      ST_Length(c.coordinates::geography) as length_m,
      c.coordinates
    from public.cables c
    where c.to_node_id = p_node_id

    union all

    select
      w.hop + 1,
      c.id,
      c.from_node_id,
      c.to_node_id,
      c.pon_port,
      ST_Length(c.coordinates::geography),
      c.coordinates
    from walk w
    join public.cables c on c.to_node_id = w.from_node_id
    join public.nodes n on n.id = w.from_node_id
    where n.type <> 'olt' -- stop once we've reached the OLT; nothing further upstream
  )
  select
    w.hop,
    w.cable_id,
    w.from_node_id,
    w.to_node_id,
    w.pon_port,
    w.length_m,
    ST_AsGeoJSON(w.coordinates)::jsonb as geometry
  from walk w
  order by w.hop;
$$;

grant execute on function public.get_node_path_to_olt(uuid) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- 5.1 — trace_fiber_fault(offline_node_ids)
--
-- ALGORITHM (see the Phase 5 README section for the full walkthrough):
--   1. Database Lookup — get each affected ONU's upstream cable-id path via
--      get_node_path_to_olt(), ordered ONU-outward.
--   2. Intersection Analysis — intersect all paths to find cable segments
--      common to every affected ONU. Because each ONU's own last-mile drop
--      cable is unique to it, this naturally narrows down to real SHARED
--      trunk/splitter segments (or nothing, if the ONUs don't share a path).
--   3. Active Node Validation — discard any shared segment that also feeds
--      a currently ONLINE node; a break there would have taken that node
--      down too, so the real break must be further downstream.
--   4. Of what's left, the segment CLOSEST to the affected ONUs (fewest
--      hops from them) is the most probable break: a break further
--      upstream would, by definition, have affected a wider set of nodes
--      than what was actually reported down.
--
-- Returns exactly one row: the suspect cable, its geometry (for map
-- flashing), a best-guess lat/lng (midpoint of that cable), the PON port,
-- affected user count, distance from the OLT in meters, and a plain-English
-- note explaining the result (including the "no segment found" and
-- "single user down" edge cases).
-- ----------------------------------------------------------------------------

create or replace function public.trace_fiber_fault(p_offline_node_ids uuid[])
returns table (
  fault_cable_id uuid,
  fault_latitude double precision,
  fault_longitude double precision,
  fault_geometry jsonb,
  affected_pon_port text,
  affected_count integer,
  distance_from_olt_m double precision,
  note text
)
language plpgsql
stable
as $$
declare
  v_node_id uuid;
  v_path_cable_ids uuid[];
  v_common_cable_ids uuid[];
  v_shared_cable_id uuid;
  v_shared_hop int;
  v_cable public.cables%rowtype;
  v_distance double precision;
  v_lat double precision;
  v_lng double precision;
  v_geometry jsonb;
  v_pon_port text;
  v_note text;
begin
  if p_offline_node_ids is null or array_length(p_offline_node_ids, 1) is null then
    raise exception 'trace_fiber_fault: p_offline_node_ids must contain at least one node id';
  end if;

  -- 1 & 2: build + intersect upstream cable-id paths for every affected ONU.
  v_common_cable_ids := null;

  foreach v_node_id in array p_offline_node_ids loop
    select array_agg(cable_id order by hop) into v_path_cable_ids
    from public.get_node_path_to_olt(v_node_id);

    if v_path_cable_ids is null then
      continue; -- this node has no recorded upstream cable at all
    end if;

    if v_common_cable_ids is null then
      v_common_cable_ids := v_path_cable_ids;
    else
      select array_agg(x) into v_common_cable_ids
      from (
        select unnest(v_common_cable_ids)
        intersect
        select unnest(v_path_cable_ids)
      ) as t(x);
    end if;
  end loop;

  if v_common_cable_ids is null or array_length(v_common_cable_ids, 1) is null then
    return query select
      null::uuid, null::double precision, null::double precision, null::jsonb, null::text,
      array_length(p_offline_node_ids, 1), null::double precision,
      'No shared upstream cable segment found across the affected ONUs — they may not share a common PON path, or the topology (cable from/to links) has not been drawn yet.'::text;
    return;
  end if;

  -- 3: Active Node Validation.
  select array_agg(cid) into v_common_cable_ids
  from unnest(v_common_cable_ids) as cid
  where not exists (
    select 1
    from public.nodes n
    join public.get_node_path_to_olt(n.id) p on p.cable_id = cid
    where n.status = 'online'
  );

  if v_common_cable_ids is null or array_length(v_common_cable_ids, 1) is null then
    return query select
      null::uuid, null::double precision, null::double precision, null::jsonb, null::text,
      array_length(p_offline_node_ids, 1), null::double precision,
      'Every shared segment also serves a currently-online ONU — the break is likely further downstream (closer to the affected ONUs individually) rather than on a shared trunk segment.'::text;
    return;
  end if;

  -- 4: pick the surviving shared segment closest to the affected ONUs.
  select cid, gp.hop into v_shared_cable_id, v_shared_hop
  from unnest(v_common_cable_ids) as cid
  join public.get_node_path_to_olt(p_offline_node_ids[1]) gp on gp.cable_id = cid
  order by gp.hop asc
  limit 1;

  select * into v_cable from public.cables where id = v_shared_cable_id;

  select
    ST_Y(ST_LineInterpolatePoint(v_cable.coordinates, 0.5)),
    ST_X(ST_LineInterpolatePoint(v_cable.coordinates, 0.5)),
    ST_AsGeoJSON(v_cable.coordinates)::jsonb
  into v_lat, v_lng, v_geometry;

  select sum(gp.length_m) into v_distance
  from public.get_node_path_to_olt(p_offline_node_ids[1]) gp
  where gp.hop <= v_shared_hop;

  -- pon_port may only be set on the top-level cable nearest the OLT; walk
  -- outward from the suspect segment toward the OLT to find the nearest
  -- ancestor that does have it set.
  select coalesce(
    v_cable.pon_port,
    (
      select gp.pon_port
      from public.get_node_path_to_olt(p_offline_node_ids[1]) gp
      where gp.pon_port is not null and gp.hop >= v_shared_hop
      order by gp.hop desc
      limit 1
    )
  ) into v_pon_port;

  if array_length(p_offline_node_ids, 1) = 1 then
    v_note := 'Only one ONU reported down — fault is localized to its own drop cable / last-mile segment.';
  else
    v_note := 'Shared upstream segment identified across all affected ONUs and validated against currently-online ONUs on the same path.';
  end if;

  return query select
    v_shared_cable_id, v_lat, v_lng, v_geometry, v_pon_port,
    array_length(p_offline_node_ids, 1), v_distance, v_note;
end;
$$;

grant execute on function public.trace_fiber_fault(uuid[]) to anon, authenticated;
