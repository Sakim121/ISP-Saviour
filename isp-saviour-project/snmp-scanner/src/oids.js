// ============================================================================
// PLACEHOLDER OIDs — READ BEFORE USE ON A REAL DEVICE
//
// SNMP OIDs for ONU status / RX optical power are NOT standardized across
// EPON/GPON OLT vendors, and often differ between firmware versions of the
// SAME vendor. The values below are the best-known starting points (the
// generic set uses the standard EPON MIB branch; the VSOL set uses VSOL's
// enterprise MIB branch as referenced in Phase 7 of this project), but they
// are placeholders, not guarantees.
//
// Before running this against a real OLT:
//   1. SNMP-walk the device broadly first (e.g. `snmpwalk -v2c -c public
//      <ip> 1.3.6.1.4.1` for vendor OIDs, or 1.3.6.1.2.1.155 for the
//      standard EPON MIB) and compare against the vendor's MIB file if they
//      provide one.
//   2. Adjust the two OIDs below for your device accordingly.
//   3. Adjust the value-parsing logic in scanner.js if your device encodes
//      status/power differently than assumed there (see the comments next
//      to STATUS_ONLINE_VALUE and RX_POWER_SCALE below).
//
// This file intentionally keeps every brand's config in one place so a
// mismatch is a one-line fix, not a code change.
// ============================================================================

const OID_SETS = {
  generic: {
    // Standard EPON MIB (dot3ahFec / similar) branch — commonly seen across
    // several white-label EPON OLTs. Walking this returns one row per ONU.
    onuStatusBaseOid: '1.3.6.1.2.1.155.1.4.1.1.1.1',
    onuRxPowerBaseOid: '1.3.6.1.2.1.155.1.4.1.5.1.2', // dot3ExtPkgOptIfInputPower
    statusOnlineValue: 1, // 1 = registered/active on most implementations of this MIB
    rxPowerScale: 0.01, // many devices report as hundredths of a dBm (e.g. -1148 -> -11.48)
  },
  vsol: {
    // VSOL enterprise MIB branch — see Phase 7 for the specific V1600D8 OIDs.
    onuStatusBaseOid: '1.3.6.1.4.1.37950.1.1.5.6.1.7',
    onuRxPowerBaseOid: '1.3.6.1.4.1.37950.1.1.5.6.1.15',
    statusOnlineValue: 1,
    rxPowerScale: 0.01,
  },
  netlink: {
    // Netlink does not publish a stable public enterprise OID at the time
    // of writing — these are unverified placeholders. Confirm with an
    // snmpwalk against your specific Netlink model before trusting this.
    onuStatusBaseOid: '1.3.6.1.4.1.99999.1.1.1.1',
    onuRxPowerBaseOid: '1.3.6.1.4.1.99999.1.1.1.2',
    statusOnlineValue: 1,
    rxPowerScale: 0.01,
  },
  syrotech: {
    // Same caveat as Netlink — unverified placeholder branch.
    onuStatusBaseOid: '1.3.6.1.4.1.88888.1.1.1.1',
    onuRxPowerBaseOid: '1.3.6.1.4.1.88888.1.1.1.2',
    statusOnlineValue: 1,
    rxPowerScale: 0.01,
  },
};

function getOidSetForBrand(brand) {
  const set = OID_SETS[brand];
  if (!set) {
    console.warn(`[oids] Unknown OLT_BRAND "${brand}" — falling back to "generic". Valid options: ${Object.keys(OID_SETS).join(', ')}`);
    return OID_SETS.generic;
  }
  return set;
}

module.exports = { OID_SETS, getOidSetForBrand };
