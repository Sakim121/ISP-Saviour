const { createClient } = require('@supabase/supabase-js');

function createSupabaseClient({ url, serviceRoleKey }) {
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Upserts one ONU's live status + RX power via the `rpc_snmp_upsert_onu`
 * Postgres function (see isp-saviour/supabase/migrations/0007_snmp_sync_
 * support.sql). This is a genuine SQL UPSERT (INSERT ... ON CONFLICT DO
 * UPDATE) reached through an RPC call rather than the generic
 * `.from('nodes').upsert()` helper — done this way specifically so that a
 * technician's manually-set node name/GPS location is never overwritten by
 * scanner defaults on repeat scans. Only `status` and `metadata` are
 * touched once a node already exists.
 *
 * @param externalId  Stable key for this physical ONU, e.g. "192.168.80.2:12"
 * @param defaultName Used only the FIRST time this externalId is seen
 * @param status      'online' | 'offline'
 * @param metadata    Arbitrary JSON merged into the existing metadata (RX power, etc.)
 */
async function upsertOnu(supabase, { externalId, defaultName, status, metadata }) {
  const { data, error } = await supabase.rpc('rpc_snmp_upsert_onu', {
    p_external_id: externalId,
    p_default_name: defaultName,
    p_status: status,
    p_metadata: metadata,
  });

  if (error) {
    console.warn(`[supabaseSync] upsert failed for ${externalId}:`, error.message);
    return { success: false, error };
  }

  return { success: true, data };
}

module.exports = { createSupabaseClient, upsertOnu };
