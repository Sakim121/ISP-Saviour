/**
 * Thin helpers around Leaflet's built-in toGeoJSON(), kept in one place so
 * Phase 3 (Supabase persistence) has a single, stable import surface instead
 * of reaching into Leaflet layer internals from page components.
 */

/** Convert any Leaflet layer (Marker or Polyline) to a GeoJSON Feature. */
export function layerToGeoJSON(layer) {
  return layer.toGeoJSON();
}

/** Point Feature -> { latitude, longitude } for the `nodes` table shape. */
export function pointGeoJSONToLatLng(feature) {
  const [longitude, latitude] = feature.geometry.coordinates;
  return { latitude, longitude };
}

/** LineString Feature -> [[lat, lng], ...] for react-leaflet <Polyline>. */
export function lineGeoJSONToPositions(feature) {
  return feature.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
}
