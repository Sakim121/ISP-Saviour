import L from 'leaflet';

// Marker color scheme — exactly per Phase 2 spec.
export const STATUS_COLORS = {
  online: '#22c55e', // Green
  offline: '#ef4444', // Red
  wire_down: '#eab308', // Yellow
};

const TYPE_LABEL = {
  olt: 'OLT',
  splitter: 'SPL',
  onu: '', // ONUs render as a plain dot (matches reference screenshots)
};

/**
 * Build a Leaflet divIcon colored by status, labeled by node type.
 * Using a divIcon (not image files) keeps this dependency-free and avoids
 * the classic Leaflet/Vite marker-image path problem for our own markers.
 */
export function getMarkerIcon(type, status) {
  const color = STATUS_COLORS[status] ?? '#94a3b8';
  const label = TYPE_LABEL[type] ?? '';
  const size = type === 'onu' ? 20 : 28;

  return L.divIcon({
    className: '',
    html: `
      <div style="
        width:${size}px;height:${size}px;border-radius:9999px;
        background:${color};border:2px solid #ffffff;
        box-shadow:0 1px 4px rgba(0,0,0,0.45);
        display:flex;align-items:center;justify-content:center;
        color:#ffffff;font-size:9px;font-weight:700;font-family:sans-serif;
        line-height:1;
      ">${label}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}
