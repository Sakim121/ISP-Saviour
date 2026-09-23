# ISP SAVIOUR — Phase 1: Navbar / Navigation System

This is Phase 1 of the multi-phase ISP Saviour build. It contains **only** the
navigation system: a collapsible sidebar with the exact 5 groups / 15 routes
specified, plus lightweight page stubs so every route is actually reachable
and every specified dropdown/filter is visible and testable.

No backend, no map rendering, no Supabase, no SNMP yet — those arrive in
Phases 2–7 as planned.

## What's included

```
isp-saviour/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx                     ← exact routes wired here
│   ├── index.css
│   ├── data/
│   │   └── navigation.js           ← single source of truth: routes, icons, dropdown options
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.jsx         ← collapsible nav groups, active states
│   │   │   ├── Topbar.jsx
│   │   │   └── DashboardLayout.jsx
│   │   └── ui/
│   │       ├── Select.jsx          ← reusable dropdown
│   │       └── Card.jsx            ← PageHeader / FilterBar / Card / EmptyState
│   └── pages/
│       ├── dashboard/   (Live Fiber Map, Live ONU Status, Logs)
│       ├── setup/       (OLT Management, PON Port Config, Radius Server Sync)
│       ├── mapping/     (Fiber Path, Splitters, ONU Mapping)
│       ├── diagnostics/ (RX Power, RX History, Topology)
│       └── admin/       (Fault Tracer, Users, Notifications)
```

## Exact routes (do not change)

| Group | Route | Page |
|---|---|---|
| Dashboard & Monitoring | `/dashboard/map` | Live Fiber Map |
| | `/dashboard/onu-status` | Live ONU Status |
| | `/dashboard/logs` | Telegram & System Logs |
| Infrastructure Setup | `/setup/olt` | OLT Management |
| | `/setup/pon-ports` | PON Port Config |
| | `/setup/radius` | Radius Server Sync |
| Network Drawing & Mapping | `/mapping/fiber-path` | Fiber Path / Route |
| | `/mapping/splitters` | Junction & Splitter Setup |
| | `/mapping/onu-bind` | ONU Mapping |
| Diagnostics & Analytics | `/diagnostics/rx-power` | RX Power Analytics |
| | `/diagnostics/rx-history` | RX History Reports |
| | `/diagnostics/topology` | Topology View |
| System Tools & Admin | `/admin/fault-tracer` | Fiber Cut Tracing Tool |
| | `/admin/users` | User Management |
| | `/admin/notifications` | Notification Settings |

## Install & run

```bash
cd isp-saviour
npm install
npm run dev
```

Open the printed local URL (default `http://localhost:5173`). It will
redirect to `/dashboard/map`.

## How to test Phase 1

1. **Sidebar groups** — click each of the 5 group headers (Dashboard &
   Monitoring, Infrastructure Setup, Network Drawing & Mapping, Diagnostics &
   Analytics, System Tools & Admin). Each should expand/collapse independently.
2. **Active states** — click any sub-item; it should highlight in the sidebar
   (solid brand color) and its parent group should stay expanded.
3. **All 15 routes** — click through every sub-item and confirm the URL
   changes to match the table above and the correct page stub renders.
4. **Dropdowns per page** — confirm every dropdown listed in the spec appears
   on its page with the exact option values (see `src/data/navigation.js`).
5. **Dependent dropdown** — on *Live Fiber Map* and *Fiber Path / Route*,
   confirm "Select PON Port" / "Source PON" is disabled until an OLT is
   chosen, then populates PON 1–PON 16.
6. **Responsive** — shrink the browser to mobile width; the sidebar should
   collapse behind a hamburger menu (top-left) and open as an overlay.

## Notes on scope

- OLT names shown in dropdowns (`Ark OLT 1`, etc.) are placeholder data —
  Phase 3 replaces these with live Supabase queries.
- Map canvases show an "Interactive Map Canvas" placeholder — Leaflet wiring
  arrives in Phase 2.
- No routes, dropdown option lists, or menu items were added beyond the
  specification.

## Next

Phase 2 — Live Operational Map (Leaflet + react-leaflet + drawing tools).

---

# Phase 2: Live Operational Map

Adds a real Leaflet map (OpenStreetMap tiles) into the **Live Fiber Map**
page (`/dashboard/map`), with drawing tools, status-based marker filtering,
and GeoJSON capture hooks that Phase 3 will wire to Supabase.

## New files

```
src/
├── components/map/
│   ├── LiveMapView.jsx      ← main map component (state, filtering, GeoJSON hooks)
│   ├── GeomanBridge.jsx     ← gives useGeoman() access to the live Leaflet map instance
│   ├── useGeoman.js         ← Leaflet-Geoman setup + create/edit/remove event wiring
│   ├── markerIcons.js       ← colored divIcons: green=online, red=offline, yellow=wire down
│   ├── StatusToggle.jsx     ← floating "Show: Online / Offline / Wire Down" checkboxes
│   └── AddNodeModal.jsx     ← name+type prompt shown right after a marker is drawn
├── data/
│   └── dummyMapData.js      ← seed nodes + default map center/zoom (placeholder until Phase 3)
├── lib/
│   ├── geojson.js           ← layerToGeoJSON() and GeoJSON <-> lat/lng helpers
│   └── leafletIconFix.js    ← fixes Leaflet's default marker image paths under Vite
```

`package.json` gained one dependency: `@geoman-io/leaflet-geoman-free`.

## Design decisions (per the "OR" choice in the spec)

- **Leaflet-Geoman**, not Leaflet.Draw — see the note at the top of this
  phase's delivery message. Isolated entirely inside `useGeoman.js` +
  `GeomanBridge.jsx`, so swapping libraries later only touches those two files.
- **Default map center**: `14.753984, 78.546275` (matches the seed/dummy
  data region). This is a placeholder — swap `DEFAULT_MAP_CENTER` in
  `dummyMapData.js` for your real service area, or make it configurable via
  `.env` in a later phase.
- **GeoJSON hooks**: `LiveMapView` accepts `onNodesGeoJSONChange` /
  `onCablesGeoJSONChange` props. Right now they default to
  `console.log(...)`. Phase 3 will pass in `saveNewNode()` / `saveNewCable()`
  (Supabase) here — no other code in this phase needs to change.

## Install & run

```bash
npm install   # picks up @geoman-io/leaflet-geoman-free
npm run dev
```

## How to test Phase 2

1. Go to **Live Fiber Map** (`/dashboard/map`). You should see an OSM map
   centered on the seed region with 6 colored markers already on it
   (1 OLT, 1 Splitter, 4 ONUs — 2 green/online, 1 yellow/wire-down, 1 red/offline).
2. **Status toggle** (bottom-left floating panel) — uncheck "Offline"; the
   red marker should disappear. Re-check it to bring it back.
3. **Top "Status Filter" dropdown** (from Phase 1) — set it to "Wire Down";
   only the yellow marker should remain visible. Set back to "All".
4. **Draw a marker** — click the marker tool in the top-left Geoman toolbar,
   click anywhere on the map. A modal should pop up asking for a name and
   type (OLT/Splitter/ONU). Confirm it — a new colored marker should appear
   at that spot (green, since new nodes default to "online").
5. **Draw a polyline** — click the polyline tool, click 2+ points on the
   map, then double-click (or click the last point again) to finish. A blue
   line should appear representing a fiber cable. Open the browser console —
   you should see a `[GeoJSON:cable]` log with the captured GeoJSON.
6. **Edit** — use Geoman's edit-mode toolbar button, drag a marker or a
   cable vertex; check the console for the corresponding GeoJSON log.
7. **Delete** — use Geoman's removal-mode toolbar button, click a drawn
   shape to delete it from the map.
8. **Popups** — click any of the seed markers; a popup should show its
   name, type, and status.

## Notes on scope

- No data is persisted anywhere yet — refreshing the page resets any marker
  or cable you drew. Persistence is Phase 3.
- The Fault Tracing visuals (flashing red/yellow damaged segment, `⚡ Broken
  Cable` marker) are **not** part of this phase — that's Phase 5.
- Marker type is shown as a colored circle with a small `OLT`/`SPL` label
  for OLTs/Splitters; ONUs render as a plain dot, matching the reference
  screenshots. This is a visual detail only, not an added feature.

## Next

Phase 3 — Supabase Database & Map Sync (schema, `saveNewNode`/`saveNewCable`/
`fetchMapData`/`subscribeToRealtimeChanges`).

---

# Phase 3: Supabase Database & Map Sync

Adds the real backend: a PostgreSQL schema (`nodes`, `cables`), and four
React↔Supabase functions that the Phase 2 map now uses instead of static
dummy data — including realtime updates with no page refresh.

## New files

```
supabase/
├── README.md                        ← how to apply the schema, geometry decision writeup
└── migrations/
    ├── 0001_init_schema.sql         ← nodes + cables tables, enums, triggers, RLS, realtime
    └── 0002_cable_rpc_functions.sql ← rpc_save_cable / rpc_fetch_cables (GeoJSON <-> PostGIS)

src/
├── lib/
│   ├── supabaseClient.js            ← createClient() singleton, reads VITE_SUPABASE_*
│   └── mapApi.js                    ← saveNewNode, saveNewCable, fetchMapData, subscribeToRealtimeChanges
├── hooks/
│   └── useMapData.js                ← fetch + realtime + loading/error/demo-mode state, used by LiveMapView
└── components/map/
    ├── LiveMapView.jsx              ← UPDATED: now backed by useMapData() instead of static dummy state
    ├── AddNodeModal.jsx             ← UPDATED: saving/error props for the async save
    └── AddCableModal.jsx            ← NEW: captures cable metadata (OLT/PON/capacity/color/manufacturer) before saveNewCable()
```

## ⚠️ Geometry decision — read before touching `cables.coordinates`

`cables.coordinates` is stored as PostGIS `geometry(LineString, 4326)`, not
a JSONB array of points. Full reasoning and the exact trade-off/consequence
is written out in `supabase/README.md` under "Geometry decision" — short
version: Phase 5's fault-tracing algorithm needs real SQL-level line
intersection queries, and PostGIS is the tool built for that; the cost is
that cable inserts/reads go through two small RPC functions
(`rpc_save_cable`, `rpc_fetch_cables`) instead of plain `.insert()`/`.select()`.

## Setup

1. Create a Supabase project (or use an existing one).
2. Follow `supabase/README.md` to run both migration files (SQL Editor is
   the fastest way — no CLI required).
3. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```
4. Fill in your project's URL and anon key (Project Settings → API):
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. `npm run dev` — the console will no longer warn about missing Supabase
   config once these are set correctly.

## Demo Mode (works even without Supabase set up)

If `.env.local` is missing, Supabase is unreachable, or the tables are
empty, `useMapData` automatically falls back to the same seed data from
Phase 2 and the map shows an amber **"Demo Mode"** banner at the top.
Drawing still works in this mode — new markers/cables are kept in local
React state only (not persisted), so you can fully exercise the UI before
wiring up a real project.

## How to test Phase 3

**With Supabase configured (recommended — exercises the real backend):**

1. Load `/dashboard/map` — the "Demo Mode" banner should **not** appear.
   Any nodes you've manually inserted via the SQL Editor's Table view
   should render as markers.
2. **Draw a marker**, fill in the Add Node modal, click Confirm. Check
   Supabase's Table Editor → `nodes` — a new row should appear with the
   name/type/status/coordinates you entered. The "Saving..." state should
   briefly show on the button.
3. **Draw a polyline**, fill in (or skip) the Add Cable modal fields, click
   "Save Fiber Path". Check Table Editor → `cables` — a new row should
   appear with `coordinates` populated (PostGIS will display it as a WKB
   hex string in the table view — that's expected and correct).
4. **Realtime test** — in the Supabase Table Editor, manually edit a node's
   `status` column (e.g. `online` → `wire_down`) and save. Without
   refreshing the browser tab showing `/dashboard/map`, the corresponding
   marker should recolor from green to yellow within a second or two.
5. **Error handling** — temporarily set an invalid `VITE_SUPABASE_ANON_KEY`
   in `.env.local`, restart the dev server, reload the map. It should fall
   back to Demo Mode with the banner showing "Supabase unreachable" rather
   than crashing.

**Without Supabase configured (demo-only smoke test):**

1. Load `/dashboard/map` — the amber Demo Mode banner should appear.
2. Draw a marker and a cable as before — they should still appear on the
   map (kept in local state), confirming the app degrades gracefully.

## Notes on scope

- Editing/dragging an existing marker or cable currently only logs its new
  GeoJSON to the console (`[GeoJSON:edit]`) — persisting edits back to
  Supabase (an `UPDATE`) wasn't part of this phase's four required
  functions and is left as a clearly-marked follow-up in `LiveMapView.jsx`.
- Deleting a drawn shape from the map (Geoman's removal tool) does not yet
  delete the underlying Supabase row — that's intentionally left to the
  dedicated CRUD pages already scaffolded in Phase 1
  (`/mapping/fiber-path`, `/mapping/splitters`, `/mapping/onu-bind`).
- RLS is enabled but permissive ("allow all") — see the note in
  `supabase/README.md`. This is intentional for this phase and is replaced
  in Phase 8.

## Next

Phase 4 — Telegram Alert System (DB trigger on `nodes.status` → Supabase
Edge Function → Telegram Bot API).

---

# Phase 4: Telegram Alert System

Wires up automatic Telegram notifications: when a node's status flips to
`offline` or `wire_down`, a Postgres trigger calls a Supabase Edge Function
that formats and sends a Telegram message. Also adds the functional
Notification Settings control that decides whether/when this fires.

## ⚠️ Two things flagged before you use this (read first)

1. **Telegram endpoint corrected.** The brief specified
   `https://telegram.org<token>/sendMessage`, which is not a real Telegram
   API endpoint. The Edge Function uses the actual one:
   `https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/sendMessage`. Full
   explanation in `supabase/README.md` → "Telegram endpoint correction".
2. **Notification Settings wording conflict.** Phase 4's spec text
   ("Send all logs / Only Wire Down / Mute Notifications") doesn't match
   Phase 1's already-built `/admin/notifications` dropdown ("Only Wire
   Down / Power Off & Wire Down / All Events"). Phase 1's dropdown was left
   untouched; Phase 4's three options were added as a new, separate,
   Supabase-backed panel on the same page. See the comment block at the top
   of `supabase/migrations/0003_notification_settings.sql`.

## New files

```
supabase/
├── migrations/
│   ├── 0003_notification_settings.sql   ← notification_settings table + enum
│   └── 0004_telegram_trigger.sql        ← trigger: fires Edge Function on offline/wire_down
└── functions/
    └── telegram-alert/
        └── index.ts                     ← Deno Edge Function: formats + sends the Telegram message

src/
├── lib/
│   └── notificationApi.js               ← fetchNotificationPreference, updateNotificationPreference
└── pages/admin/
    └── Notifications.jsx                ← UPDATED: adds the Phase 4 preference panel
```

## How it fits together

```
UPDATE nodes SET status = 'wire_down' WHERE id = ...
        │
        ▼
trg_notify_node_status_change (Postgres trigger)
  - only proceeds if status actually changed to offline/wire_down
  - checks notification_settings.preference (all_logs / only_wire_down / muted)
  - reads Edge Function URL + service_role key from Supabase Vault
        │  net.http_post(url, headers: Authorization: Bearer <service_role_key>, body: {old, new})
        ▼
Edge Function: telegram-alert
  - verifies the Bearer token === SUPABASE_SERVICE_ROLE_KEY (rejects anything else with 401)
  - formats a Markdown message
  - POSTs to https://api.telegram.org/bot<TOKEN>/sendMessage
        │
        ▼
Telegram chat receives: "🚨 NETWORK ALERT: ONU 'x' is WIRE DOWN!"
```

## Setup

Follow `supabase/README.md` → "Phase 4 setup" in order:
1. Run migrations `0003` then `0004`.
2. `supabase functions deploy telegram-alert`
3. `supabase secrets set TELEGRAM_BOT_TOKEN="..." TELEGRAM_CHAT_ID="..."`
4. Store the two Vault secrets (`telegram_edge_function_url`,
   `service_role_key`) via one SQL Editor command.

## How to test Phase 4

1. **Preference panel** — go to `/admin/notifications`. Below the
   Phase 1 dropdowns you should see three cards: "Send all logs", "Only
   Wire Down" (selected by default), "Mute Notifications". Click a
   different one — it should highlight immediately and, if Supabase is
   configured, persist (reload the page to confirm it stuck).
2. **End-to-end alert** — with the preference set to "Only Wire Down", go
   to Supabase's Table Editor, open `nodes`, and change any row's `status`
   to `wire_down`. Within a few seconds your configured Telegram chat
   should receive the alert message.
3. **Mute works** — set the preference to "Mute Notifications", change
   another node's status to `wire_down` — no message should arrive.
4. **"Only Wire Down" filters correctly** — with that preference active,
   change a node's status to `offline` (not `wire_down`) — no message
   should arrive, since only `wire_down` qualifies under that setting.
5. **Security check** — try calling the Edge Function's URL directly with
   curl/Postman without an Authorization header, or with a random Bearer
   token. It should return `401 Unauthorized` rather than sending a message.
6. **Demo mode** — without Supabase configured, `/admin/notifications`
   should still render the preference panel (with an amber "Demo Mode"
   note) and let you click between options without erroring, just without
   persistence.

## Notes on scope

- The trigger only ever fires for transitions **into** `offline` or
  `wire_down` — a node going from `offline` to `wire_down` (or vice versa)
  still counts as "changed to a monitored state" and will alert again; a
  node that's already `wire_down` being updated for an unrelated reason
  (e.g. its `metadata` changes) will not re-alert, since `status` itself
  didn't change.
- `old`/`new` payload sent to the Edge Function includes `pon_port` and
  `olt_name` pulled from `metadata` if present — these aren't guaranteed to
  exist yet since nothing currently populates them (that arrives with the
  SNMP scanner in Phase 6/7); the message simply omits those parts when absent.
- SMS Gateway / Web Push channels shown in Phase 1's "Alert Channels"
  dropdown are not implemented — only Telegram, per this phase's scope.

## Next

Phase 5 — Fiber Cut / Fault Tracing (PostGIS intersection queries + Leaflet
visualization of the damaged segment).

---

# Phase 5: Fiber Cut / Fault Tracing

The core intelligence feature: given a set of ONUs that just went offline,
find the most probable location of the fiber cut.

## ⚠️ Schema change flagged (per the "don't silently change DB fields" rule)

`cables` gained two new nullable columns: `from_node_id`, `to_node_id`.
**Why:** the algorithm needs to walk the real network as a graph
(ONU → Splitter → OLT), and nothing in Phase 3's schema recorded which two
nodes a cable actually connects — only a loose `source_olt_id` tag existed.
Full explanation is in `supabase/README.md`. Consequence: `rpc_save_cable`
gained two new optional parameters, and `AddCableModal` gained two new
fields ("Connects From" / "Connects To"). Cables saved before this phase
(with no from/to link) simply won't appear in any traced path — they still
render on the map fine, they're just invisible to the graph walk.

## New files

```
supabase/
├── migrations/
│   ├── 0005_cable_graph_edges.sql        ← cables.from_node_id/to_node_id + updated RPCs
│   └── 0006_fault_tracing_functions.sql  ← get_node_path_to_olt() + trace_fiber_fault()
└── seed/
    └── phase5_demo_topology.sql          ← OPTIONAL: a small ready-made tree to test against

src/
├── lib/
│   └── faultApi.js                       ← getNodePathToOlt, traceFiberFault, fetchOutageCandidates
└── components/map/
    ├── FaultMap.jsx                      ← flashing damaged segment + "⚡ Broken Cable" marker
    └── FaultSidebar.jsx                  ← Affected PON / Down Users / Distance from OLT

src/pages/admin/FaultTracer.jsx           ← UPDATED: fully functional (was a static stub)
src/components/map/AddCableModal.jsx      ← UPDATED: "Connects From/To" fields
src/lib/mapApi.js                         ← UPDATED: saveNewCable() passes the new graph fields
```

## The algorithm (spec 5.1), in plain terms

1. **Database Lookup** — for each affected (offline/wire-down) ONU, walk its
   cable path outward-to-OLT via `get_node_path_to_olt()` (a recursive CTE —
   this same function also satisfies spec **5.2**'s "network tree query"
   requirement, reused rather than duplicated).
2. **Intersection Analysis** — intersect all the affected ONUs' cable-id
   paths. Since each ONU's own last-mile drop cable is unique to it, this
   naturally narrows down to cable segments **genuinely shared** by the
   whole group (real trunk/splitter legs) — or nothing, if they don't share
   a path at all.
3. **Active Node Validation** — throw out any shared segment that also
   feeds a currently-**online** node. A break there would have taken that
   online node down too, so it's not the real cut.
4. **Pick the most specific one** — of what survives, the segment
   *closest* to the affected ONUs (fewest hops from them) is the most
   probable break: a break further upstream would, by definition, have
   taken out a wider set of nodes than what's actually reported down.
5. **Output** — the suspect cable's id, its geometry (for map animation),
   a best-guess lat/lng (the cable's midpoint), the PON port, affected
   count, and distance from the OLT in meters (via
   `ST_Length(coordinates::geography)`, which computes real-world
   ellipsoidal distance — this satisfies the spec's "Haversine or Leaflet
   geometry calculation" requirement using PostGIS's built-in equivalent).

## Edge cases (spec requirement — all handled)

- **Single user down** — the intersection step is skipped (only one path
  exists), so Active Node Validation strips out every segment shared with
  online nodes, correctly leaving just that ONU's own last-mile/drop cable.
- **Multiple users down** — intersection narrows to real shared trunk
  segments only; unrelated ONUs (no shared cable at all) simply return "no
  shared segment found" rather than a false match.
- **Entire loop/PON down** — with no online nodes left on that PON to
  invalidate anything, the intersection walks all the way up to the cable
  right after the OLT, correctly identifying a feeder/trunk-level break.

## Notification-wording note carried over from this page

As flagged in Phase 1, this page's "Select Down Zone" / "Outage Cluster"
dropdowns had no spec-mandated fixed option values (unlike most other
dropdowns in the brief). They're now populated live from real outage data:
"zone" = a PON grouping among currently-down ONUs, "cluster" = the resulting
checklist of affected ONUs you can select from.

## How to test Phase 5

1. Run migrations `0005` and `0006` (see `supabase/README.md`).
2. Run `seed/phase5_demo_topology.sql` once (optional but recommended for
   a first test — building a real topology by hand on the map works too,
   just takes longer).
3. Go to `/admin/fault-tracer`. You should see "Select Down Zone" populated
   (the demo seed's ONUs have no `pon_port` in metadata, so they'll show
   under "Unclustered" — that's expected for the seed data).
4. Select the zone — the Outage Cluster checklist should show "Demo ONU B"
   and "Demo ONU C", both pre-checked.
5. Click **Run Fault Trace**. Expected result per the seed script's header
   comment: the suspect segment is the Splitter → ONU B cable, with a
   flashing red/yellow line on the map, a ⚡ marker at its midpoint, and the
   sidebar showing PON 1, 2 down users, and a distance in meters.
6. **Single-user edge case** — uncheck "Demo ONU C", re-run the trace with
   only "Demo ONU B" selected. It should still return the Splitter → ONU B
   cable (now labeled as an individual last-mile fault in the note).
7. **Active node validation** — in the Table Editor, temporarily set
   "Demo ONU A" to `wire_down` too, then re-run the trace with all three
   selected. Since Demo ONU A shares cable A (OLT→Splitter) but not cable
   B/C, the algorithm should still correctly isolate to cable B/C's
   shared ancestor rather than jumping all the way to cable A.

## Notes on scope

- This phase does not automatically trigger a trace when the Telegram alert
  fires (Phase 4) — running a trace here is a manual, admin-initiated
  action, matching the page's UI-driven design in the spec.
- `distance_from_olt_m` is measured along the fiber path (sum of cable
  lengths from the ONU up to and including the suspect segment), not a
  straight-line distance — this is the geometrically correct way to report
  "how far down the fiber run" the break is.

## Next

Phase 6 — Node.js SNMP Automation (generic OLT scanner syncing live status
into Supabase).

---

# Phase 6: Node.js SNMP Automation

Lives in a **separate, sibling project folder**: `../snmp-scanner/` (not
inside `isp-saviour/`), per the project rule to keep frontend, backend,
Edge Functions, and the Node.js scanner logically separated. It's a
standalone background script — not deployed to Vercel/Netlify, not part of
the Vite build.

Full setup, OID verification steps, and background-running instructions
(PM2/nohup) are in **`snmp-scanner/README.md`**.

## ⚠️ Schema addition flagged

`nodes` gained an `external_id` column (unique, nullable) plus one new RPC,
`rpc_snmp_upsert_onu`, added in `supabase/migrations/0007_snmp_sync_
support.sql`. **Why:** a plain `.from('nodes').upsert()` would overwrite
every column present in its payload on conflict — including `name` and
`latitude`/`longitude` — so every 60-second scan would silently erase a
technician's manually-set node name and map position. The new RPC is a real
SQL upsert (`INSERT ... ON CONFLICT DO UPDATE`) that only updates
`status`/`metadata` once a row exists, using `external_id` (constructed by
the scanner as `<OLT_HOST>:<snmp_index>`) as the stable match key. This
migration must be applied before running the scanner.

## What it does

```
[OLT — SNMP read-only]
        │  net-snmp GETBULK walk (status OID + RX power OID)
        ▼
[snmp-scanner/src/scanner.js]
        │  parses varbinds -> { onuIndex: { status, rxPowerDbm } }
        ▼
[snmp-scanner/src/supabaseSync.js]
        │  rpc_snmp_upsert_onu() per ONU, using external_id as the key
        ▼
[Supabase `nodes` table]
        │  (Phase 3's realtime subscription picks this up automatically)
        ▼
[Live Map — marker recolors immediately, no scanner-frontend coupling at all]
```

## How to test Phase 6

1. Apply `supabase/migrations/0007_snmp_sync_support.sql`.
2. In `snmp-scanner/`, `npm install`, then `cp .env.example .env` and fill
   in a real (or test/simulated) OLT's IP + your Supabase service role key.
3. `npm run scan-once` — check the console output and then check Supabase's
   Table Editor: you should see new rows in `nodes` with `type = 'onu'`,
   an `external_id` set, and `metadata.rx_power_dbm` populated.
4. Open `/dashboard/map` in the frontend (with the realtime subscription
   from Phase 3 active) — newly-created ONU nodes should appear at
   `(0, 0)` (expected — SNMP doesn't know GPS coordinates) and can be
   repositioned via `/mapping/onu-bind` or the map's edit mode.
5. **Resilience test** — set `OLT_HOST` in `.env` to an unreachable IP,
   run `npm run scan-once` again. It should log a warning
   ("unreachable or SNMP error... will retry next cycle") and exit cleanly
   rather than throwing/crashing.
6. **No data loss test** — manually rename one of the scanner-created nodes
   and reposition it on the map, then run `npm run scan-once` again. The
   name and position should NOT revert — only `status`/`metadata` update.

## Notes on scope

- If you don't have a physical OLT to test against yet, this phase is
  still fully reviewable via the "unreachable OLT" resilience test above —
  the important behaviors (never crashing, never clobbering manual edits,
  real upsert semantics) don't require live hardware to verify.
- OID correctness for your specific device is explicitly **not**
  guaranteed — see `snmp-scanner/README.md` → "OID Verification". Phase 7
  narrows this down to one specific, named device (VSOL V1600D8) with the
  exact OIDs given in that phase's brief.

## Next

Phase 7 — VSOL V1600D8 OLT Integration (device-specific `olt-scanner.js`).

---

# Phase 7: VSOL V1600D8 OLT Integration

Lives in its own sibling folder: `../vsol-v1600d8-scanner/`, separate from
both the frontend and Phase 6's generic scanner — per the spec's explicit
ask for a standalone single-file `olt-scanner.js` targeting one named
device. Full setup, OID verification, and background-running instructions
are in **`vsol-v1600d8-scanner/README.md`**.

## No new schema needed

This phase reuses Phase 6's `rpc_snmp_upsert_onu` function
(`supabase/migrations/0007_snmp_sync_support.sql`) as-is — same safe-upsert
guarantees (never clobbers a manually set name/GPS location), same
`external_id` convention (`<OLT_HOST>:<snmp_index>`). Nothing to migrate.

## What's specific to this phase vs. Phase 6

| | Phase 6 (`snmp-scanner/`) | Phase 7 (`vsol-v1600d8-scanner/`) |
|---|---|---|
| Scope | Generic, multi-brand, config-driven | One named device: VSOL V1600D8 |
| Files | Multi-file (config/oids/scanner/sync/index) | Single file: `olt-scanner.js` |
| OIDs | Placeholder sets per brand in `oids.js` | Exact OIDs from the Phase 7 brief, with automatic fallback to the generic EPON branch |
| Target | Configurable via `.env` | Defaults to `192.168.80.2:161`, community `public` (per spec), still overridable |

Run **one or the other** per physical OLT — not both — to avoid duplicate
upserts against the same `external_id`s.

## How to test Phase 7

See `vsol-v1600d8-scanner/README.md` → "How to test" for the full
checklist (mirrors Phase 6's: `scan-once`, verify Supabase rows, verify the
unreachable-OLT resilience path, verify manual edits aren't clobbered on
re-scan).

## Next

Phase 8 — Final Production Deployment (Vercel/Netlify config, Supabase CLI
deployment, RLS hardening, CORS).

---

# Phase 8: Final Production Deployment

## ⚠️ Read this first — behavior change

Applying migration `0008_production_rls.sql` changes what the app can do
for an unauthenticated visitor: **reading** the map/dashboard still works
for everyone (no login required), but **writing** — drawing a marker or
cable, saving a notification preference — now requires signing in as a
technician-tier account. Before this phase, the app had no login at all
and every write succeeded via the anon key. This is a deliberate,
documented change (not a silent one) — see the top of this README's Phase
8 section and the comment block in `0008_production_rls.sql` for the full
reasoning. **Do not apply migration 0008 to a project your frontend is
actively using unless you're ready for this.**

## New files

```
isp-saviour/
├── vercel.json                    ← SPA rewrite for Vercel
├── netlify.toml                   ← SPA redirect + build config for Netlify
├── .env.production                ← template only, real values go in host dashboard
├── src/
│   ├── lib/AuthContext.jsx        ← minimal Supabase Auth wrapper (session, profile, isTechnician)
│   └── pages/Login.jsx            ← technician sign-in page (no self-signup)
supabase/
├── migrations/
│   └── 0008_production_rls.sql    ← profiles/roles + real nodes/cables/notification_settings RLS
└── DEPLOYMENT.md                  ← consolidated, ordered production deployment checklist
```

`App.jsx` gained a `/login` route (outside `DashboardLayout`, since reading
never requires auth); `Topbar.jsx` now shows Sign In / the current user +
Sign Out.

## 8.1 — Frontend Deployment

### Vercel
1. Import the GitHub repo in Vercel.
2. Framework preset: **Vite** (auto-detected).
3. Environment Variables (Project → Settings → Environment Variables):
   ```
   VITE_SUPABASE_URL=<production Supabase URL>
   VITE_SUPABASE_ANON_KEY=<production anon key>
   ```
4. Deploy. `vercel.json`'s rewrite rule is what prevents a 404 on hard
   refresh of any client-side route (e.g. `/dashboard/map`) — without it,
   Vercel would try to serve a literal file at that path and fail.

### Netlify
1. Import the repo; `netlify.toml` already sets the build command
   (`npm run build`) and publish directory (`dist`).
2. Site configuration → Environment variables → add the same two
   `VITE_SUPABASE_*` values.
3. Deploy. The `[[redirects]]` rule in `netlify.toml` is Netlify's
   equivalent fix for the same SPA-routing 404 problem.

Either host: **never commit real values into `.env.production`** — it's
checked into this repo as an empty template intentionally; the real values
belong in the host's dashboard only.

## 8.2 — Supabase Production

Fully covered in **`supabase/DEPLOYMENT.md`** — project creation, CLI
linking, applying all 8 migrations in order, Vault secrets, Edge Function
deployment/secrets, and creating your first technician account (there's no
self-signup UI by design).

## 8.3 — Security & Performance

**RLS** — see `0008_production_rls.sql`. Summary: `nodes`/`cables` (and,
flagged as an addition beyond the literal spec, `notification_settings`)
are readable by anyone, writable only by an authenticated user whose
`profiles.role` is technician-tier or above (`field_technician`,
`support_staff`, `admin`, or `super_admin`; `viewer` is read-only).

**CORS** — two different things are commonly meant by this, and they're
handled differently:
- Supabase's hosted REST/Auth API (everything behind `.from()`/`.auth`)
  **does not offer per-project CORS origin restriction** on standard
  plans — this is by design, since the anon key is meant to be public
  (embedded in client JS) and RLS, not CORS, is the actual security
  boundary. There is no config file or dashboard setting that changes this;
  don't rely on CORS here.
- Your **own Edge Functions** (`telegram-alert`) are custom code you
  control, and CAN set explicit CORS headers. `telegram-alert` currently
  has no CORS headers because it's only ever called server-to-server (by
  the Postgres trigger, never by the browser) — if you add a future Edge
  Function that IS called from the frontend, restrict it like this:
  ```ts
  const ALLOWED_ORIGIN = 'https://your-production-domain.com';
  // ... in the Response:
  headers: { 'Access-Control-Allow-Origin': ALLOWED_ORIGIN, ... }
  ```

## How to test Phase 8

1. **SPA routing** — after deploying, navigate directly to a deep URL
   (e.g. paste `https://yourapp.vercel.app/dashboard/map` fresh, or hard
   refresh while on it). It should load the app, not a 404.
2. **Anonymous read still works** — without signing in, `/dashboard/map`
   should show existing markers/cables normally.
3. **Anonymous write is blocked** — without signing in, try drawing a new
   marker. Confirm it, and it should now surface a permission error
   (Supabase's RLS rejection message) rather than silently succeeding.
4. **Sign in and write succeeds** — go to `/login`, sign in with a
   technician account created per `supabase/DEPLOYMENT.md` step 7, then
   repeat step 3 — it should now succeed.
5. **Viewer role is still read-only** — create a second test account, leave
   its role as the trigger's default (`viewer`), sign in as it, and confirm
   a write attempt is still rejected.
6. **Realtime still works post-RLS** — with a technician session open in
   one tab, change a node's status in the Table Editor; a second tab (even
   signed out) should still see the marker recolor live (Phase 3's realtime
   subscription only needs SELECT access, which stays public).

## Notes on scope

- No password-reset or self-signup flow was built — intentionally minimal,
  per the project's "don't add unrelated features" rule; account creation
  is an admin/dashboard action, documented in `supabase/DEPLOYMENT.md`.
- `profiles.role` has no UI to change it from within the app yet (Phase 1's
  `/admin/users` page is still the same non-functional stub from Phase 1) —
  role changes are a manual SQL step for now, called out explicitly in
  `DEPLOYMENT.md` rather than left undocumented.

## Next

Phase 9 — Manual Deployment Actions (the human checklist: push to GitHub,
connect Vercel, set secrets — no more code, just the sequence of clicks/commands).
