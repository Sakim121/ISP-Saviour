const snmp = require('net-snmp');

/**
 * Creates a read-only SNMP v2c session. This scanner NEVER calls session.set()
 * anywhere in the codebase — only get/walk — so it cannot modify OLT
 * configuration, per the project's "SNMP scanner must be read-only" rule.
 */
function createSession({ host, port, community }) {
  return snmp.createSession(host, community, {
    port,
    version: snmp.Version2c,
    retries: 1,
    timeout: 5000,
  });
}

/**
 * Walks an OID subtree and resolves with an array of { oid, value }.
 * Individual varbind errors (a single missing row) are skipped rather than
 * failing the whole walk; a session/network-level error rejects the promise
 * so the caller can log it and move on without crashing the process.
 */
function snmpWalk(session, baseOid) {
  return new Promise((resolve, reject) => {
    const results = [];

    session.walk(
      baseOid,
      20, // maxRepetitions per GETBULK request
      (varbinds) => {
        varbinds.forEach((vb) => {
          if (snmp.isVarbindError(vb)) {
            return; // skip this one row, keep walking
          }
          results.push({ oid: vb.oid, value: vb.value });
        });
      },
      (error) => {
        if (error) {
          reject(error);
        } else {
          resolve(results);
        }
      }
    );
  });
}

module.exports = { createSession, snmpWalk };
