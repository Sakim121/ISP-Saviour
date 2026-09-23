-- ============================================================================
-- ISP SAVIOUR — Phase 6: SNMP sync support
--
-- WHY THIS CHANGE: the SNMP scanner needs to reliably "upsert" the same ONU
-- on every scan cycle (every 60s) without either (a) creating a duplicate
-- node each time, or (b) clobbering a technician's manually-set name/GPS
-- location with scanner defaults. A plain `.from('nodes').upsert(...)`
-- would update EVERY column present in the payload on conflict — including
-- name/latitude/longitude — which is unacceptable once a node has been
-- placed on the map by hand.
--
-- `external_id` is a stable key the scanner constructs itself
-- (e.g. "192.168.80.2:PON1:7"), unique per physical ONU port. The RPC below
-- is a genuine Postgres UPSERT (INSERT ... ON CONFLICT DO UPDATE) — it just
-- only updates `status` and merges `metadata` on conflict, leaving
-- name/latitude/longitude alone once a row exists.
-- ============================================================================

alter table public.nodes add column if not exists external_id text;

create unique index if not exists nodes_external_id_unique
  on public.nodes (external_id)
  where external_id is not null;

create or replace function public.rpc_snmp_upsert_onu(
  p_external_id text,
  p_default_name text,
  p_status node_status,
  p_metadata jsonb
)
returns public.nodes
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.nodes;
begin
  insert into public.nodes (external_id, name, type, status, latitude, longitude, metadata)
  values (p_external_id, p_default_name, 'onu', p_status, 0, 0, p_metadata)
  on conflict (external_id) where external_id is not null do update
    set status   = excluded.status,
        metadata = public.nodes.metadata || excluded.metadata
  returning * into v_row;

  return v_row;
end;
$$;

-- Called by the Node.js scanner using the service_role key, so it needs the
-- grant too (anon/authenticated are included for consistency with the
-- other RPCs, though the scanner itself always uses service_role).
grant execute on function public.rpc_snmp_upsert_onu(text, text, node_status, jsonb)
  to anon, authenticated, service_role;
