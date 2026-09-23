import { supabase } from './supabaseClient';

// ============================================================================
// ISP SAVIOUR — Phase 3: Supabase data access layer for the Live Map.
// Every function here throws on failure — callers (see useMapData.js,
// LiveMapView.jsx) are responsible for try/catch + loading/error state.
// ============================================================================

/**
 * Insert a newly placed map marker (OLT / Splitter / ONU) into `nodes`.
 * @param {{name:string, type:'olt'|'splitter'|'onu', status:string,
 *           latitude:number, longitude:number, metadata?:object}} nodeData
 * @returns the inserted row (including its generated id)
 */
export async function saveNewNode(nodeData) {
  const { name, type, status, latitude, longitude, metadata = {} } = nodeData;

  const { data, error } = await supabase
    .from('nodes')
    .insert([{ name, type, status, latitude, longitude, metadata }])
    .select()
    .single();

  if (error) {
    console.error('[saveNewNode] insert failed:', error);
    throw error;
  }

  return data;
}

/**
 * Insert a newly drawn fiber route polyline into `cables`.
 * Coordinates go through the `rpc_save_cable` Postgres function so the
 * PostGIS conversion happens on the database side (see supabase/README.md
 * for why `coordinates` is a geometry column rather than JSONB).
 *
 * @param {{sourceOltId?:string|null, ponPort?:string|null,
 *           coreCapacity?:string|null, coreColor?:string|null,
 *           manufacturer?:string|null, fromNodeId?:string|null,
 *           toNodeId?:string|null, geojson:object}} cableData
 *           geojson may be a GeoJSON Feature OR a bare Geometry — either is
 *           accepted, only the `geometry` part is sent on.
 *           fromNodeId/toNodeId (Phase 5) are the graph edge endpoints used
 *           by the Fault Tracing algorithm — omit them and this cable simply
 *           won't be part of any traced path.
 */
export async function saveNewCable(cableData) {
  const { sourceOltId, ponPort, coreCapacity, coreColor, manufacturer, fromNodeId, toNodeId, geojson } = cableData;

  const geometry = geojson?.type === 'Feature' ? geojson.geometry : geojson;

  const { data, error } = await supabase.rpc('rpc_save_cable', {
    p_source_olt_id: sourceOltId ?? null,
    p_pon_port: ponPort ?? null,
    p_core_capacity: coreCapacity ?? null,
    p_core_color: coreColor ?? null,
    p_manufacturer: manufacturer ?? null,
    p_geojson: geometry,
    p_from_node_id: fromNodeId ?? null,
    p_to_node_id: toNodeId ?? null,
  });

  if (error) {
    console.error('[saveNewCable] rpc_save_cable failed:', error);
    throw error;
  }

  return data;
}

/**
 * Fetch nodes + cables concurrently so the map can render both as soon as
 * both requests resolve.
 * @returns {{nodes: Array, cables: Array}} cables come back pre-shaped for
 *          <Polyline positions={...} />: { id, sourceOltId, ponPort,
 *          coreCapacity, coreColor, manufacturer, positions: [[lat,lng],...] }
 */
export async function fetchMapData() {
  const [nodesResult, cablesResult] = await Promise.all([
    supabase.from('nodes').select('*'),
    supabase.rpc('rpc_fetch_cables'),
  ]);

  if (nodesResult.error) {
    console.error('[fetchMapData] nodes fetch failed:', nodesResult.error);
    throw nodesResult.error;
  }
  if (cablesResult.error) {
    console.error('[fetchMapData] cables fetch failed:', cablesResult.error);
    throw cablesResult.error;
  }

  const nodes = nodesResult.data ?? [];
  const cables = (cablesResult.data ?? []).map((row) => ({
    id: row.id,
    sourceOltId: row.source_olt_id,
    ponPort: row.pon_port,
    coreCapacity: row.core_capacity,
    coreColor: row.core_color,
    manufacturer: row.manufacturer,
    // row.geometry is GeoJSON: { type: 'LineString', coordinates: [[lng,lat], ...] }
    positions: (row.geometry?.coordinates ?? []).map(([lng, lat]) => [lat, lng]),
  }));

  return { nodes, cables };
}

/**
 * Subscribe to realtime INSERT/UPDATE/DELETE events on `nodes` and/or
 * `cables`. Example: an ONU's status flips to 'wire_down' in the DB ->
 * onNodeChange fires -> caller updates React state -> the Leaflet marker
 * recolors immediately, no page refresh.
 *
 * @param {{onNodeChange?: (payload) => void, onCableChange?: (payload) => void}} handlers
 * @returns {() => void} unsubscribe function — call it on component unmount.
 */
export function subscribeToRealtimeChanges({ onNodeChange, onCableChange } = {}) {
  const channel = supabase.channel('isp-saviour-map-realtime');

  if (onNodeChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'nodes' },
      onNodeChange
    );
  }

  if (onCableChange) {
    channel.on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'cables' },
      onCableChange
    );
  }

  channel.subscribe((status) => {
    if (status === 'CHANNEL_ERROR') {
      console.error('[subscribeToRealtimeChanges] channel error — realtime updates will not arrive.');
    }
  });

  return () => {
    supabase.removeChannel(channel);
  };
}
