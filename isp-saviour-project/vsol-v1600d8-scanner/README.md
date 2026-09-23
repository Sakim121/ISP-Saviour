# ISP Saviour — VSOL V1600D8 Scanner (Phase 7)

A standalone, single-file, **read-only** SNMP scanner specifically for a
VSOL V1600D8 (8-port EPON OLT), per the Phase 7 spec. It's separate from
Phase 6's generic multi-brand scanner (`snmp-scanner/`) — same underlying
idea, but this one targets one named device with the exact OIDs given in
the brief, in a single `olt-scanner.js` file as specified.

## ⚠️ Before you use this on a real unit

1. **OIDs are from the spec, not independently verified against a physical
   V1600D8.** They're used as given (not silently changed), but SNMP OIDs
   can still shift between firmware revisions — see "OID Verification"
   below before trusting the output in production.
2. **Read-only by design** — only SNMP `get`/`walk` are used anywhere in
   this file. It cannot alter the OLT's configuration.
3. Needs the Supabase **service role key** (bypasses RLS to write `nodes`).
   Never commit `.env` or expose this key to a browser/frontend.
4. **Depends on Phase 6's migration.** This script reuses the
   `rpc_snmp_upsert_onu` Postgres function created in
   `isp-saviour/supabase/migrations/0007_snmp_sync_support.sql` — make sure
   that's been applied to your Supabase project first. No new migration was
   needed for this phase.
5. **Don't run this alongside Phase 6's generic scanner against the same
   OLT** — both would upsert the same `external_id`s and just duplicate
   work. Pick one per physical OLT: this device-specific script for a VSOL
   V1600D8, or the generic one (`OLT_BRAND=vsol`) if you prefer the more
   general/multi-device tool.

## Install

```bash
cd vsol-v1600d8-scanner
npm install
cp .env.example .env
```

Edit `.env` — the connection defaults already match the spec exactly
(`192.168.80.2:161`, community `public`); only Supabase credentials are
required:
```
OLT_HOST=192.168.80.2
OLT_PORT=161
SNMP_COMMUNITY=public
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SCAN_INTERVAL_MS=60000
```

## Run

```bash
npm start          # runs continuously, every SCAN_INTERVAL_MS
npm run scan-once  # one scan cycle, then exits — good for a first test
```

Expected healthy output:
```
OLT Scan Complete: 12 ONUs Online, 3 ONUs Offline
[olt-scanner] Scanning 192.168.80.2 every 60s. Press Ctrl+C to stop.
```

Expected output if the OLT is unreachable (not a crash — it keeps running):
```
[olt-scanner] OLT 192.168.80.2 unreachable or SNMP error: Request timed out. Will retry next cycle.
```

## OID Verification

`olt-scanner.js` uses, exactly as given in the Phase 7 brief:
- ONU status: `1.3.6.1.4.1.37950.1.1.5.6.1.7` (VSOL enterprise branch),
  falling back automatically to `1.3.6.1.2.1.155.1.4.1.1.1.1` (generic EPON
  MIB) if the VSOL branch returns nothing.
- RX power: `1.3.6.1.2.1.155.1.4.1.5.1.2` (`dot3ExtPkgOptIfInputPower`).

Before trusting this in production, confirm against your actual unit:
```bash
snmpwalk -v2c -c public 192.168.80.2 1.3.6.1.4.1.37950.1.1.5.6.1.7
snmpwalk -v2c -c public 192.168.80.2 1.3.6.1.2.1.155.1.4.1.5.1.2
```
If either comes back empty or with unexpected values, check your unit's
firmware version against VSOL's documentation for the correct branch, and
update the two `OID_...` constants near the top of `olt-scanner.js` — both
`STATUS_ONLINE_VALUE` and `RX_POWER_SCALE` are also called out as
adjustable in the comments right above them if your firmware encodes
status/power differently than assumed.

## Running in the background

### PM2 (recommended)

```bash
npm install -g pm2
pm2 start olt-scanner.js --name vsol-v1600d8-scanner
pm2 save
pm2 startup   # follow the printed instructions to survive a reboot
```

```bash
pm2 logs vsol-v1600d8-scanner
pm2 restart vsol-v1600d8-scanner
pm2 stop vsol-v1600d8-scanner
```

### Plain nohup

```bash
nohup npm start > scanner.log 2>&1 &
```

## How to test

1. Confirm migration `0007_snmp_sync_support.sql` is applied in Supabase.
2. `npm run scan-once` against your real unit (or point `OLT_HOST` at an
   unreachable IP to verify the resilience path instead).
3. Check Supabase Table Editor → `nodes`: rows with `external_id` like
   `192.168.80.2:1.7`, `metadata.olt_model = "VSOL V1600D8"`, and
   `metadata.rx_power_dbm` populated.
4. Re-run the scan — existing rows' `status`/`metadata` should update,
   while any name/GPS you've since set manually stays untouched (same
   guarantee as Phase 6, since this uses the same upsert function).
