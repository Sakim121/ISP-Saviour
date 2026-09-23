import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { getMarkerIcon } from './markerIcons';
import { DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM } from '../../data/dummyMapData';

function getBrokenCableIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="font-size:24px;line-height:1;filter:drop-shadow(0 1px 3px rgba(0,0,0,0.5));">⚡</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

/**
 * Renders the affected ONUs plus (if a fault result is present) the
 * suspect cable segment animated between red/yellow, and a "⚡ Broken
 * Cable" marker at the calculated fault center.
 */
export default function FaultMap({ affectedNodes = [], faultResult }) {
  const [flashOn, setFlashOn] = useState(true);

  useEffect(() => {
    if (!faultResult?.fault_geometry) return undefined;
    const id = setInterval(() => setFlashOn((v) => !v), 500);
    return () => clearInterval(id);
  }, [faultResult]);

  const faultPositions = faultResult?.fault_geometry?.coordinates?.map(([lng, lat]) => [lat, lng]);

  const center = affectedNodes[0]
    ? [affectedNodes[0].latitude, affectedNodes[0].longitude]
    : DEFAULT_MAP_CENTER;

  return (
    <div className="h-[420px] w-full overflow-hidden rounded-xl border border-slate-200 shadow-card">
      <MapContainer center={center} zoom={DEFAULT_MAP_ZOOM} scrollWheelZoom className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {affectedNodes.map((node) => (
          <Marker key={node.id} position={[node.latitude, node.longitude]} icon={getMarkerIcon(node.type, node.status)}>
            <Popup>
              <p className="text-sm font-bold">{node.name}</p>
              <p className="text-xs uppercase text-slate-400">{node.status.replace('_', ' ')}</p>
            </Popup>
          </Marker>
        ))}

        {faultPositions && (
          <Polyline
            positions={faultPositions}
            pathOptions={{ color: flashOn ? '#ef4444' : '#eab308', weight: 6, opacity: 0.9 }}
          />
        )}

        {faultResult?.fault_latitude != null && (
          <Marker position={[faultResult.fault_latitude, faultResult.fault_longitude]} icon={getBrokenCableIcon()}>
            <Popup>
              <p className="text-sm font-bold text-red-600">⚡ Broken Cable</p>
              <p className="mt-1 text-xs text-slate-500">{faultResult.note}</p>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
