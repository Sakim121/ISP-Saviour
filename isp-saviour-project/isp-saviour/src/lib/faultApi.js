import { supabase } from './supabaseClient';

/**
 * 5.2 — Walk a single node's upstream path back to its OLT.
 * Returns one row per cable hop, ordered outward from the node (hop 0 =
 * the cable directly feeding it) to the OLT.
 */
export async function getNodePathToOlt(nodeId) {
  const { data, error } = await supabase.rpc('get_node_path_to_olt', { p_node_id: nodeId });
  if (error) {
    console.error('[getNodePathToOlt] failed:', error);
    throw error;
  }
  return data ?? [];
}

/**
 * 5.1 — Run the fault tracing algorithm across a set of currently-offline
 * ONU node ids. Returns a single result row (see trace_fiber_fault's SQL
 * comment for the full algorithm) or null if nothing came back.
 */
export async function traceFiberFault(offlineNodeIds) {
  if (!offlineNodeIds?.length) {
    throw new Error('traceFiberFault requires at least one node id.');
  }

  const { data, error } = await supabase.rpc('trace_fiber_fault', {
    p_offline_node_ids: offlineNodeIds,
  });

  if (error) {
    console.error('[traceFiberFault] failed:', error);
    throw error;
  }

  return data?.[0] ?? null;
}

/**
 * Currently offline/wire_down ONUs — the candidate pool for the Fault
 * Tracer page's "Select Down Zone" / "Outage Cluster" controls.
 */
export async function fetchOutageCandidates() {
  const { data, error } = await supabase
    .from('nodes')
    .select('*')
    .in('status', ['offline', 'wire_down'])
    .eq('type', 'onu');

  if (error) {
    console.error('[fetchOutageCandidates] failed:', error);
    throw error;
  }

  return data ?? [];
}
