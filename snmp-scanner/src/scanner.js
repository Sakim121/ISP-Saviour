const { createSession, snmpWalk } = require('./snmpClient');
const { getOidSetForBrand } = require('./oids');

/**
 * Strips the base OID prefix off a full OID to get the table index — this
 * is typically the ONU's port/index number on the OLT, e.g. walking
 * "1.3.6.1.2.1.155.1.4.1.1.1.1" might return
 * "1.3.6.1.2.1.155.1.4.1.1.1.1.3" for ONU index "3".
 *
 * NOTE: some OLTs use a compound index (e.g. "<pon>.<onu>" like "1.7" for
 * PON 1, ONU 7) rather than a flat integer. If your device does this,
 * adjust this function to split on the extra segment(s) — the rest of the
 * scanner treats whatever this returns as an opaque, stable per-ONU key.
 */
function extractIndex(fullOid, baseOid) {
  if (!fullOid.startsWith(`${baseOid}.`)) return fullOid;
  return fullOid.slice(baseOid.length + 1);
}

/**
 * Scans one OLT over SNMP and returns a map of { [onuIndex]: { status, rxPowerDbm } }.
 * Never throws for a single bad varbind — only rejects if the OLT is
 * completely unreachable (handled by the caller in index.js).
 */
async function scanOlt({ host, port, community, brand }) {
  const oids = getOidSetForBrand(brand);
  const session = createSession({ host, port, community });

  try {
    const [statusRows, rxPowerRows] = await Promise.all([
      snmpWalk(session, oids.onuStatusBaseOid),
      snmpWalk(session, oids.onuRxPowerBaseOid),
    ]);

    const onuMap = {};

    statusRows.forEach(({ oid, value }) => {
      const index = extractIndex(oid, oids.onuStatusBaseOid);
      onuMap[index] = onuMap[index] || {};
      onuMap[index].status = Number(value) === oids.statusOnlineValue ? 'online' : 'offline';
    });

    rxPowerRows.forEach(({ oid, value }) => {
      const index = extractIndex(oid, oids.onuRxPowerBaseOid);
      onuMap[index] = onuMap[index] || {};
      const raw = Number(value);
      onuMap[index].rxPowerDbm = Number.isFinite(raw) ? raw * oids.rxPowerScale : null;
    });

    return onuMap;
  } finally {
    session.close();
  }
}

module.exports = { scanOlt, extractIndex };
