# ISP Saviour — SNMP Scanner (Phase 6)

A standalone, read-only Node.js script that polls an OLT over SNMP for live
ONU status and RX optical power, and syncs it into ISP Saviour's Supabase
`nodes` table. Runs completely separately from the frontend (`isp-saviour/`)
— this is a background process you run on a machine with network access to
your OLTs, not something deployed to Vercel/Netlify.

## ⚠️ Before you use this on a real OLT

1. **The OIDs in `src/oids.js` are placeholders.** SNMP OIDs are not
   standardized across vendors/firmware. Verify them against your actual
   device (see "OID Verification" below) before trusting any output.
2. **This script is read-only by design** — it only ever calls SNMP
   `get`/`walk`, never `set`. It cannot change your OLT's configuration.
3. Requires the Supabase **service role key**, not the anon key (it needs
   to write to `nodes` and bypass RLS). Never commit `.env` or expose this
   key anywhere a browser could read it.

## Install

```bash
cd snmp-scanner
npm install
cp .env.example .env
```

Edit `.env`:
```
OLT_HOST=192.168.80.2
OLT_PORT=161
SNMP_COMMUNITY=public
OLT_BRAND=generic          # generic | vsol | netlink | syrotech
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # Project Settings -> API -> service_role
SCAN_INTERVAL_MS=60000
```

You also need to have run migration `0007_snmp_sync_support.sql` (in the
`isp-saviour` project) against your Supabase database first — this script
depends on the `rpc_snmp_upsert_onu` function it creates.

## Run

```bash
npm start          # runs continuously, scanning every SCAN_INTERVAL_MS
npm run scan-once  # runs exactly one scan cycle, then exits — good for testing
```

Expected output on a healthy run:
```
[2026-09-22T12:00:00.000Z] Starting scan of 192.168.80.2 (brand: generic)...
[scan] Complete: 12 ONUs Online, 3 ONUs Offline (of 15 discovered).
[scanner] Running every 60s. Press Ctrl+C to stop.
```

Expected output if the OLT is unreachable (this is NOT a crash — the loop
keeps running and retries next cycle):
```
[scan] OLT 192.168.80.2 unreachable or SNMP error: Request timed out. Will retry next cycle.
```

## OID Verification

The OID sets live in `src/oids.js`, one object per brand. Before running
against a real device:

1. Install `net-snmp` tools or use `snmpwalk` (Linux/Mac: `apt install
   snmp-utils` / `brew install net-snmp`) to explore the device manually:
   ```bash
   snmpwalk -v2c -c public 192.168.80.2 1.3.6.1.2.1.155   # standard EPON MIB branch
   snmpwalk -v2c -c public 192.168.80.2 1.3.6.1.4.1.37950 # VSOL enterprise branch (example)
   ```
2. Compare what comes back against your vendor's MIB file, if they provide
   one, to confirm which sub-OID represents ONU status vs. RX power, and
   what the status values / power scaling actually mean on your firmware.
3. Update the relevant entry in `src/oids.js`. Everything else in the
   codebase treats these as configuration, not logic, so no other file
   needs to change.

If you don't have the exact OIDs yet, `npm run scan-once` will still run
safely — it will just log "returned zero ONUs" rather than doing anything
destructive, since the scanner never writes anything on a failed/empty walk.

## Matching ONUs to existing map nodes

Each discovered ONU is keyed by `<OLT_HOST>:<snmp_index>` (its
`external_id` in the `nodes` table — see migration `0007`). The first time
an index is seen, a new node is created with a default name (`ONU-<index>`)
and placeholder coordinates `(0, 0)` — you'll want to rename it and place
it correctly on the map via `/mapping/onu-bind` or the Live Map's edit
mode afterward. Every scan after that only updates `status` and merges
`metadata` (RX power, last sync time) — it will never overwrite a name or
GPS location you've since set manually.

## Running in the background

### Option A — PM2 (recommended for a dedicated always-on machine)

```bash
npm install -g pm2
pm2 start src/index.js --name isp-saviour-snmp-scanner
pm2 save
pm2 startup   # follow the printed instructions to survive a reboot
```

Useful commands:
```bash
pm2 logs isp-saviour-snmp-scanner
pm2 restart isp-saviour-snmp-scanner
pm2 stop isp-saviour-snmp-scanner
```

### Option B — plain `nohup` (quick and dirty)

```bash
nohup npm start > scanner.log 2>&1 &
```

## Notes on scope

- One scanner process = one OLT. If you have multiple OLTs, run one
  instance per OLT (a separate `.env`/PM2 process each), or extend
  `config.js` to accept a list — not built into this phase to keep the
  script simple, per the project's "beginner-friendly" rule.
- This script does not know about PON port numbers beyond whatever the
  SNMP index encodes — see the comment in `src/scanner.js`'s
  `extractIndex()` if your OLT uses a compound PON+ONU index format.
