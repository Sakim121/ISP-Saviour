const config = require('./config');
const { scanOlt } = require('./scanner');
const { createSupabaseClient, upsertOnu } = require('./supabaseSync');

const supabase = createSupabaseClient(config.supabase);

/**
 * Runs one full scan-and-sync cycle. Any failure here is caught by the
 * caller (runOnce's try/catch below) — this function never throws past its
 * own boundary in normal operation, and per-ONU sync failures are logged
 * and skipped rather than aborting the whole cycle.
 */
async function runOnce() {
  const startedAt = new Date();
  console.log(`\n[${startedAt.toISOString()}] Starting scan of ${config.olt.host} (brand: ${config.olt.brand})...`);

  let onuMap;
  try {
    onuMap = await scanOlt(config.olt);
  } catch (err) {
    // OLT unreachable / SNMP timeout / network error — log and return
    // quietly. The next setInterval tick will simply try again.
    console.warn(`[scan] OLT ${config.olt.host} unreachable or SNMP error: ${err.message}. Will retry next cycle.`);
    return;
  }

  const onuIndexes = Object.keys(onuMap);

  if (onuIndexes.length === 0) {
    console.warn('[scan] SNMP walk succeeded but returned zero ONUs — check the OID set in src/oids.js for your OLT brand/model.');
    return;
  }

  let onlineCount = 0;
  let offlineCount = 0;

  for (const onuIndex of onuIndexes) {
    const { status = 'offline', rxPowerDbm = null } = onuMap[onuIndex];
    const externalId = `${config.olt.host}:${onuIndex}`;

    const result = await upsertOnu(supabase, {
      externalId,
      defaultName: `ONU-${onuIndex}`,
      status,
      metadata: {
        snmp_onu_index: onuIndex,
        snmp_olt_host: config.olt.host,
        rx_power_dbm: rxPowerDbm,
        last_snmp_sync: new Date().toISOString(),
      },
    });

    if (result.success) {
      status === 'online' ? onlineCount++ : offlineCount++;
    }
  }

  console.log(`[scan] Complete: ${onlineCount} ONUs Online, ${offlineCount} ONUs Offline (of ${onuIndexes.length} discovered).`);
}

async function main() {
  const runOnceOnly = process.argv.includes('--once');

  await runOnce();

  if (runOnceOnly) {
    console.log('[scan] --once flag set, exiting after a single scan.');
    process.exit(0);
  }

  console.log(`[scanner] Running every ${config.scanIntervalMs / 1000}s. Press Ctrl+C to stop.`);
  setInterval(() => {
    runOnce().catch((err) => {
      // Belt-and-suspenders: runOnce already catches its own errors, but if
      // something unexpected still throws, log it and keep the interval
      // alive rather than letting an unhandled rejection kill the process.
      console.error('[scanner] Unexpected error during scan cycle:', err);
    });
  }, config.scanIntervalMs);
}

process.on('unhandledRejection', (err) => {
  console.error('[scanner] Unhandled rejection (process will keep running):', err);
});

main().catch((err) => {
  console.error('[scanner] Fatal startup error:', err.message);
  process.exit(1);
});
