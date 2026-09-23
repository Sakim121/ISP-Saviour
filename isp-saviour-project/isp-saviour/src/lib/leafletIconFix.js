// Vite/Webpack break Leaflet's default marker image paths because the
// library resolves them relative to its own bundled CSS. This patches the
// default icon so any *stock* L.Marker (e.g. the one Leaflet-Geoman shows
// for a split-second while you're drawing) still renders correctly.
// Our own app markers use custom divIcons (see markerIcons.js) and are
// unaffected by this — this fix only matters for Geoman's transient marker.
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
