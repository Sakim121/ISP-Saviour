import React, { useCallback, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import { AlertTriangle, Loader2 } from 'lucide-react';
import GeomanBridge from './GeomanBridge';
import StatusToggle from './StatusToggle';
import AddNodeModal from './AddNodeModal';
import AddCableModal from './AddCableModal';
import { getMarkerIcon } from './markerIcons';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../data/dummyMapData';
import useMapData from '../../hooks/useMapData';
import { saveNewNode, saveNewCable } from '../../lib/mapApi';

// Maps the page-level "Status Filter" dropdown (Phase 1, single-select,
// options: All/Online/Offline/Power Off/Wire Down) onto this map's internal
// status keys, so the top FilterBar and the map stay in sync.
const STATUS_FILTER_TO_KEY = {
  Online: 'online',
  Offline: 'offline',
  'Wire Down': 'wire_down',
  'Power Off': 'power_off',
};

export default function LiveMapView({ statusFilter = 'All' }) {
  const { nodes, cables, loading, error, usingFallbackData, setNodes, setCables } = useMapData();

  const [visibleStatuses, setVisibleStatuses] = useState({
    online: true,
    offline: true,
    wire_down: true,
  });

  const [pendingMarker, setPendingMarker] = useState(null); // { layer, coords }
  const [savingNode, setSavingNode] = useState(false);
  const [nodeError, setNodeError] = useState(null);

  const [pendingCable, setPendingCable] = useState(null); // { layer }
  const [savingCable, setSavingCable] = useState(false);
  const [cableError, setCableError] = useState(null);

  const oltOptions = useMemo(
    () => nodes.filter((n) => n.type === 'olt').map((n) => ({ label: n.name, value: n.id })),
    [nodes]
  );

  // All nodes, for the Phase 5 "Connects From/To" graph-link fields.
  const nodeOptions = useMemo(
    () => nodes.map((n) => ({ label: `${n.name} (${n.type})`, value: n.id })),
    [nodes]
  );

  // --- Geoman draw events -----------------------------------------------

  const handleCreate = useCallback((e) => {
    const { shape, layer } = e;

    if (shape === 'Marker') {
      const { lat, lng } = layer.getLatLng();
      setPendingMarker({ layer, coords: { lat, lng } });
    } else if (shape === 'Line') {
      setPendingCable({ layer });
    }
  }, []);

  const handleEdit = useCallback((e) => {
    // Persisting edits to existing shapes back to Supabase (UPDATE) is out
    // of scope for this phase — logged here as the capture point later
    // work can hook into.
    if (e?.layer?.toGeoJSON) {
      console.log('[GeoJSON:edit]', e.layer.toGeoJSON());
    }
  }, []);

  const handleRemove = useCallback(() => {
    // Drawn layers manage their own on-map removal via the Geoman toolbar;
    // deleting the underlying Supabase row is a separate, explicit action
    // left for the dedicated management pages (Phase 1's /mapping/* routes).
  }, []);

  // --- Node (marker) save -------------------------------------------------

  const confirmAddNode = async (formValues) => {
    if (!pendingMarker) return;
    const { coords, layer } = pendingMarker;
    const nodeData = {
      name: formValues.name,
      type: formValues.type,
      status: formValues.status,
      latitude: coords.lat,
      longitude: coords.lng,
      metadata: {},
    };

    setSavingNode(true);
    setNodeError(null);
    try {
      if (usingFallbackData) {
        // Demo mode — no reachable Supabase project, keep the node local only.
        setNodes((prev) => [...prev, { ...nodeData, id: `node-${Date.now()}` }]);
      } else {
        const saved = await saveNewNode(nodeData);
        setNodes((prev) => [...prev, saved]);
      }
      layer.remove(); // replaced by our declarative <Marker> below
      setPendingMarker(null);
    } catch (err) {
      setNodeError(err.message ?? 'Failed to save node.');
    } finally {
      setSavingNode(false);
    }
  };

  const cancelAddNode = () => {
    pendingMarker?.layer.remove();
    setPendingMarker(null);
    setNodeError(null);
  };

  // --- Cable (polyline) save ----------------------------------------------

  const confirmAddCable = async (formValues) => {
    if (!pendingCable) return;
    const { layer } = pendingCable;
    const geojson = layer.toGeoJSON();
    const positions = layer.getLatLngs().map((p) => [p.lat, p.lng]);

    setSavingCable(true);
    setCableError(null);
    try {
      if (usingFallbackData) {
        setCables((prev) => [...prev, { id: `cable-${Date.now()}`, positions, ...formValues }]);
      } else {
        const saved = await saveNewCable({ ...formValues, geojson });
        setCables((prev) => [...prev, { id: saved.id, positions, ...formValues }]);
      }
      layer.remove(); // replaced by our declarative <Polyline> below
      setPendingCable(null);
    } catch (err) {
      setCableError(err.message ?? 'Failed to save cable.');
    } finally {
      setSavingCable(false);
    }
  };

  const cancelAddCable = () => {
    pendingCable?.layer.remove();
    setPendingCable(null);
    setCableError(null);
  };

  // --- Filtering ------------------------------------------------------------

  const visibleNodes = nodes.filter((node) => {
    if (!visibleStatuses[node.status] && node.status !== 'power_off') return false;
    if (statusFilter === 'All') return true;
    return node.status === STATUS_FILTER_TO_KEY[statusFilter];
  });

  return (
    <div className="relative h-[600px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-card">
      {loading && (
        <div className="absolute inset-0 z-[1500] flex items-center justify-center bg-white/70">
          <div className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm text-slate-500 shadow-card">
            <Loader2 size={16} className="animate-spin" /> Loading map data...
          </div>
        </div>
      )}

      {!loading && usingFallbackData && (
        <div className="absolute left-1/2 top-3 z-[1000] flex -translate-x-1/2 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-card">
          <AlertTriangle size={14} />
          Demo Mode — {error ? 'Supabase unreachable' : 'no data yet'}, showing seed markers. Connect Supabase (.env) for live sync.
        </div>
      )}

      <MapContainer center={DEFAULT_MAP_CENTER} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeomanBridge onCreate={handleCreate} onEdit={handleEdit} onRemove={handleRemove} />

        {cables.map((cable) => (
          <Polyline key={cable.id} positions={cable.positions} pathOptions={{ color: '#3b82f6', weight: 3 }} />
        ))}

        {visibleNodes.map((node) => (
          <Marker key={node.id} position={[node.latitude, node.longitude]} icon={getMarkerIcon(node.type, node.status)}>
            <Popup>
              <div className="min-w-[140px] text-sm">
                <p className="font-bold text-slate-800">{node.name}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">{node.type}</p>
                <p className="mt-1 text-xs text-slate-600">
                  Status: <span className="font-semibold">{node.status.replace('_', ' ')}</span>
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      <StatusToggle visibleStatuses={visibleStatuses} onChange={setVisibleStatuses} />

      <AddNodeModal
        open={!!pendingMarker}
        coords={pendingMarker?.coords}
        saving={savingNode}
        error={nodeError}
        onCancel={cancelAddNode}
        onConfirm={confirmAddNode}
      />

      <AddCableModal
        open={!!pendingCable}
        oltOptions={oltOptions}
        nodeOptions={nodeOptions}
        saving={savingCable}
        error={cableError}
        onCancel={cancelAddCable}
        onConfirm={confirmAddCable}
      />
    </div>
  );
}
