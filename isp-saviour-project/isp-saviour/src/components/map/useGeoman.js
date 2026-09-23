import { useEffect } from 'react';
import '@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css';
import '@geoman-io/leaflet-geoman-free';

/**
 * Attaches Leaflet-Geoman's drawing toolbar to a live Leaflet map instance
 * and forwards its create/edit/remove events.
 *
 * Draw Marker  -> represents OLTs / Splitters / ONUs
 * Draw Polyline -> represents Fiber Cables
 * Edit / Drag / Removal modes are enabled per spec ("Edit Polylines",
 * "Delete Polylines", "Edit Markers", "Delete Markers").
 *
 * callbacks:
 *   onCreate(e)  — e.shape is 'Marker' | 'Line', e.layer is the raw layer
 *   onEdit(e)    — fired per-layer when a shape is reshaped/dragged
 *   onRemove(e)  — fired per-layer when a shape is deleted via the toolbar
 */
export default function useGeoman(map, { onCreate, onEdit, onRemove } = {}) {
  useEffect(() => {
    if (!map) return undefined;

    map.pm.addControls({
      position: 'topleft',
      drawMarker: true,
      drawPolyline: true,
      drawCircleMarker: false,
      drawCircle: false,
      drawRectangle: false,
      drawPolygon: false,
      drawText: false,
      editMode: true,
      dragMode: true,
      cutPolygon: false,
      removalMode: true,
      rotateMode: false,
    });

    const handleCreate = (e) => {
      onCreate?.(e);
      // Geoman fires edit/remove on the LAYER itself, not the map, so we
      // subscribe per newly-created layer.
      e.layer.on('pm:edit', (editEvt) => onEdit?.({ ...editEvt, shape: e.shape, layer: e.layer }));
      e.layer.on('pm:remove', () => onRemove?.({ shape: e.shape, layer: e.layer }));
    };

    map.on('pm:create', handleCreate);

    return () => {
      map.off('pm:create', handleCreate);
      if (map.pm) {
        map.pm.removeControls();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map]);
}
