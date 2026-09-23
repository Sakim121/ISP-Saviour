// ============================================================================
// ISP SAVIOUR — Phase 7: VSOL V1600D8 OLT Integration
//
// Standalone, lightweight, READ-ONLY SNMP scanner for a specific device:
//   Target OLT : VSOL V1600D8 (8-Port EPON OLT)
//   Target IP  : 192.168.80.2 (default — override via .env)
//   Port       : 161
//   Protocol   : SNMP v2c
//   Community  : public
//
// This script only ever calls SNMP get/walk — never set — so it cannot
// modify the OLT's configuration under any circumstance.
//
// This is intentionally a separate, single-file script from Phase 6's
// generic multi-brand scanner (snmp-scanner/), per that phase's own spec
// wording ("Create a standalone lightweight Node.js script: olt-scanner.js").
// It reuses the SAME Supabase-side upsert function (rpc_snmp_upsert_onu,
// from migration 0007) that Phase 6 already set up — no new schema needed.
// ============================================================================

require('dotenv').config();
const snmp = require('net-snmp');
const { createClient } = require('@supabase/supabase-js');

// ---------------------------------------------------------------------------
// Configuration — defaults match the Phase 7 spec exactly; override via .env
// ---------------------------------------------------------------------------

const OLT_HOST = process.env.OLT_HOST || '192.168.80.2';
const OLT_PORT = Number(process.env.OLT_PORT || 161);
const SNMP_COMMUNITY = process.env.SNMP_COMMUNITY || 'public';
const SCAN_INTERVAL_MS = Number(process.env.SCAN_INTERVAL_MS || 60000);

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    '[olt-scanner] Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Copy .env.example to .env and fill them in.'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// 7.1 / 7.2 — OIDs
//
// ⚠️ VERIFY BEFORE PRODUCTION USE (per this project's OID Verification
// rule): these are the OIDs given in the Phase 7 brief, used as-is and not
// silently changed. They are a reasonable starting point for this exact
// device, but SNMP OIDs can still vary by firmware revision — confirm with
// `snmpwalk -v2c -c public 192.168.80.2 <oid>` against your actual unit
// before relying on this in production. See README "OID Verification".
// ---------------------------------------------------------------------------

// VSOL enterprise MIB branch — ONU registration/status table.
const OID_ONU_STATUS_VSOL = '1.3.6.1.4.1.37950.1.1.5.6.1.7';
// Generic/standard EPON MIB branch — fallback if the VSOL-specific branch
// returns nothing (some firmware revisions expose only the standard MIB).
const OID_ONU_STATUS_GENERIC = '1.3.6.1.2.1.155.1.4.1.1.1.1';
// RX Optical Power — dot3ExtPkgOptIfInputPower, as given in the brief.
const OID_ONU_RX_POWER = '1.3.6.1.2.1.155.1.4.1.5.1.2';

const STATUS_ONLINE_VALUE = 1; // 1 = online/active; anything else = offline/down (per brief)
const RX_POWER_SCALE = 0.01; // many EPON OLTs report hundredths of a dBm (e.g. -1148 -> -11.48)

// ---------------------------------------------------------------------------
// Read-only SNMP session + walk helper
// ---------------------------------------------------------------------------

function createSession() {
  return snmp.createSession(OLT_HOST, SNMP_COMMUNITY, {
    port: OLT_PORT,
    version: snmp.Version2c,
    retries: 1,
    timeout: 5000,
  });
}

/** 7.1 — SNMP Walk function. Resolves [{oid, value}], skipping bad rows. */
function snmpWalk(session, baseOid) {
  return new Promise((resolve, reject) => {
    const rows = [];
    session.walk(
      baseOid,
      20, // maxRepetitions per GETBULK request
      (varbinds) => {
        varbinds.forEach((vb) => {
          if (snmp.isVarbindError(vb)) return; // skip this row, keep walking
          rows.push({ oid: vb.oid, value: vb.value });
        });
      },
      (error) => (error ? reject(error) : resolve(rows))
    );
  });
}

function extractIndex(oid, baseOid) {
  return oid.startsWith(`${baseOid}.`) ? oid.slice(baseOid.length + 1) : oid;
}

/**
 * VSOL's interface index is commonly compound, e.g. "1.7" for PON port 1,
 * ONU 7. If your unit instead reports a flat integer, ponPort will simply
 * come back null and onuId will be the whole index — confirm the real
 * format for your firmware via snmpwalk (see README) and adjust here if
 * needed; nothing else in this file depends on the exact split.
 */
function parseOnuIndex(index) {
  const parts = index.split('.');
  if (parts.length >= 2) {
    return { ponPort: `PON ${parts[0]}`, onuId: parts[parts.length - 1] };
  }
  return { ponPort: null, onuId: index };
}

// ---------------------------------------------------------------------------
// 7.1 + 7.2 — Walk status + RX power, merge into one map keyed by SNMP index
// ---------------------------------------------------------------------------

async function scanOnce() {
  const session = createSession();
  try {
    let statusBaseOid = OID_ONU_STATUS_VSOL;
    let statusRows;

    try {
      statusRows = await snmpWalk(session, OID_ONU_STATUS_VSOL);
      if (statusRows.length === 0) throw new Error('VSOL branch returned no rows');
    } catch (err) {
      console.warn(`[olt-scanner] VSOL status OID branch failed (${err.message}) — falling back to generic EPON MIB branch.`);
      statusBaseOid = OID_ONU_STATUS_GENERIC;
      statusRows = await snmpWalk(session, OID_ONU_STATUS_GENERIC);
    }

    const rxRows = await snmpWalk(session, OID_ONU_RX_POWER);

    const onuMap = {};

    statusRows.forEach(({ oid, value }) => {
      const index = extractIndex(oid, statusBaseOid);
      onuMap[index] = onuMap[index] || {};
      onuMap[index].status = Number(value) === STATUS_ONLINE_VALUE ? 'online' : 'offline';
    });

    rxRows.forEach(({ oid, value }) => {
      const index = extractIndex(oid, OID_ONU_RX_POWER);
      onuMap[index] = onuMap[index] || {};
      const raw = Number(value);
      onuMap[index].rxPowerDbm = Number.isFinite(raw) ? raw * RX_POWER_SCALE : null;
    });

    return onuMap;
  } finally {
    session.close();
  }
}

// ---------------------------------------------------------------------------
// 7.3 — Supabase Sync
// Reuses rpc_snmp_upsert_onu (Phase 6, migration 0007) — a real Postgres
// UPSERT that only touches status/metadata on conflict, never a manually
// set name/GPS location. external_id = "<OLT_HOST>:<snmp_index>", matching
// the same convention the generic scanner uses.
// ---------------------------------------------------------------------------

async function syncToSupabase(onuMap) {
  const indexes = Object.keys(onuMap);
  let onlineCount = 0;
  let offlineCount = 0;

  for (const index of indexes) {
    const { status = 'offline', rxPowerDbm = null } = onuMap[index];
    const { ponPort, onuId } = parseOnuIndex(index);
    const externalId = `${OLT_HOST}:${index}`;

    const { error } = await supabase.rpc('rpc_snmp_upsert_onu', {
      p_external_id: externalId,
      p_default_name: `VSOL-ONU-${onuId}`,
      p_status: status,
      p_metadata: {
        snmp_onu_index: index,
        snmp_olt_host: OLT_HOST,
        pon_port: ponPort,
        rx_power_dbm: rxPowerDbm,
        olt_model: 'VSOL V1600D8',
        last_snmp_sync: new Date().toISOString(),
      },
    });

    if (error) {
      console.warn(`[olt-scanner] Supabase sync failed for ${externalId}: ${error.message}`);
      continue; // one bad row should not stop the rest of the batch
    }

    if (status === 'online') onlineCount++;
    else offlineCount++;
  }

  return { onlineCount, offlineCount, total: indexes.length };
}

// ---------------------------------------------------------------------------
// 7.4 — Scan Loop
// ---------------------------------------------------------------------------

async function runScanCycle() {
  try {
    const onuMap = await scanOnce();
    const discovered = Object.keys(onuMap).length;

    if (discovered === 0) {
      console.warn('[olt-scanner] SNMP walk succeeded but found zero ONUs — check the OIDs at the top of this file against your unit (see README "OID Verification").');
      return;
    }

    const { onlineCount, offlineCount } = await syncToSupabase(onuMap);
    console.log(`OLT Scan Complete: ${onlineCount} ONUs Online, ${offlineCount} ONUs Offline`);
  } catch (err) {
    // OLT timeout / network disconnect / SNMP error — warn and return.
    // The process stays alive; the next setInterval tick retries.
    console.warn(`[olt-scanner] OLT ${OLT_HOST} unreachable or SNMP error: ${err.message}. Will retry next cycle.`);
  }
}

function main() {
  const runOnceOnly = process.argv.includes('--once');

  runScanCycle().then(() => {
    if (runOnceOnly) {
      console.log('[olt-scanner] --once flag set, exiting after a single scan.');
      process.exit(0);
      return;
    }

    console.log(`[olt-scanner] Scanning ${OLT_HOST} every ${SCAN_INTERVAL_MS / 1000}s. Press Ctrl+C to stop.`);
    setInterval(runScanCycle, SCAN_INTERVAL_MS);
  });
}

process.on('unhandledRejection', (err) => {
  console.error('[olt-scanner] Unhandled rejection (process will keep running):', err);
});

main();
