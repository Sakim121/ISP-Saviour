import { useMap } from 'react-leaflet';
import useGeoman from './useGeoman';

/**
 * react-leaflet's <MapContainer> only exposes the underlying Leaflet map
 * instance to descendants via the useMap() hook — so Geoman is wired up
 * from this invisible child rather than from the parent LiveMapView.
 */
export default function GeomanBridge({ onCreate, onEdit, onRemove }) {
  const map = useMap();
  useGeoman(map, { onCreate, onEdit, onRemove });
  return null;
}
