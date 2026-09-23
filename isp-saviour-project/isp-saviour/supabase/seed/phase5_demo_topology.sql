-- ============================================================================
-- ISP SAVIOUR — Phase 5: OPTIONAL demo topology seed
--
-- Not a migration — run this manually (SQL Editor) only if you want a ready
-- made tree to test trace_fiber_fault() against without drawing one by hand
-- on the map first. Safe to run once on an otherwise-empty `nodes`/`cables`.
--
-- Topology this creates:
--
--   Demo OLT 1
--       │  (cable A, pon_port = 'PON 1')
--       ▼
--   Demo Splitter 1
--     ├──(cable B)──▶ Demo ONU A  [online]
--     └──(cable C)──▶ Demo ONU B  [wire_down]
--                          │
--                     (cable D)
--                          ▼
--                    Demo ONU C  [wire_down]
--
-- Expected trace_fiber_fault(ARRAY[onu_b_id, onu_c_id]) result:
--   - cable B (Splitter -> ONU B) is the shared segment for B & C's paths.
--   - Demo ONU A is online and does NOT use cable B or cable A alone... wait,
--     ONU A DOES use cable A (Splitter->OLT leg) — so cable A gets excluded
--     by Active Node Validation, leaving cable B as the suspect segment.
--   - Distance from OLT reported = length of cable A + cable B.
-- ============================================================================

do $$
declare
  v_olt_id uuid;
  v_splitter_id uuid;
  v_onu_a_id uuid;
  v_onu_b_id uuid;
  v_onu_c_id uuid;
begin
  insert into public.nodes (name, type, status, latitude, longitude)
  values ('Demo OLT 1', 'olt', 'online', 14.75400, 78.54400)
  returning id into v_olt_id;

  insert into public.nodes (name, type, status, latitude, longitude)
  values ('Demo Splitter 1', 'splitter', 'online', 14.75450, 78.54450)
  returning id into v_splitter_id;

  insert into public.nodes (name, type, status, latitude, longitude)
  values ('Demo ONU A', 'onu', 'online', 14.75500, 78.54470)
  returning id into v_onu_a_id;

  insert into public.nodes (name, type, status, latitude, longitude)
  values ('Demo ONU B', 'onu', 'wire_down', 14.75520, 78.54500)
  returning id into v_onu_b_id;

  insert into public.nodes (name, type, status, latitude, longitude)
  values ('Demo ONU C', 'onu', 'wire_down', 14.75560, 78.54540)
  returning id into v_onu_c_id;

  -- Cable A: OLT -> Splitter (carries PON 1)
  insert into public.cables (source_olt_id, pon_port, from_node_id, to_node_id, coordinates)
  values (
    v_olt_id, 'PON 1', v_olt_id, v_splitter_id,
    ST_SetSRID(ST_MakeLine(ST_MakePoint(78.54400, 14.75400), ST_MakePoint(78.54450, 14.75450)), 4326)
  );

  -- Cable B: Splitter -> ONU A (still online, so this branch stays "healthy")
  insert into public.cables (source_olt_id, from_node_id, to_node_id, coordinates)
  values (
    v_olt_id, v_splitter_id, v_onu_a_id,
    ST_SetSRID(ST_MakeLine(ST_MakePoint(78.54450, 14.75450), ST_MakePoint(78.54470, 14.75500)), 4326)
  );

  -- Cable C: Splitter -> ONU B (the suspect segment — shared by B and C's paths, not used by any online node)
  insert into public.cables (source_olt_id, from_node_id, to_node_id, coordinates)
  values (
    v_olt_id, v_splitter_id, v_onu_b_id,
    ST_SetSRID(ST_MakeLine(ST_MakePoint(78.54450, 14.75450), ST_MakePoint(78.54500, 14.75520)), 4326)
  );

  -- Cable D: ONU B -> ONU C (daisy-chained drop, both down)
  insert into public.cables (source_olt_id, from_node_id, to_node_id, coordinates)
  values (
    v_olt_id, v_onu_b_id, v_onu_c_id,
    ST_SetSRID(ST_MakeLine(ST_MakePoint(78.54500, 14.75520), ST_MakePoint(78.54540, 14.75560)), 4326)
  );

  raise notice 'Demo topology created. OLT=%, Splitter=%, ONU A=%, ONU B=%, ONU C=%',
    v_olt_id, v_splitter_id, v_onu_a_id, v_onu_b_id, v_onu_c_id;
end $$;
