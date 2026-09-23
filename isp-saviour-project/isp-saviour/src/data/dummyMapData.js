// ============================================================================
// PLACEHOLDER DATA — replaced by fetchMapData() (Supabase) in Phase 3.
// Coordinates are a plausible seed area only, matching the reference
// screenshots' region, so the map isn't empty during Phase 2 testing.
// ============================================================================

export const DEFAULT_MAP_CENTER = [14.753984, 78.546275];
export const DEFAULT_MAP_ZOOM = 15;

export const DUMMY_NODES = [
  {
    id: 'olt-1',
    name: 'Ark OLT 1',
    type: 'olt',
    status: 'online',
    latitude: 14.75498,
    longitude: 78.5461,
    metadata: {},
  },
  {
    id: 'splitter-1',
    name: 'SEH Beside Pole',
    type: 'splitter',
    status: 'online',
    latitude: 14.75565,
    longitude: 78.5468,
    metadata: { splitterRatio: '1:4' },
  },
  {
    id: 'onu-1',
    name: 'healthcare2',
    type: 'onu',
    status: 'online',
    latitude: 14.7566,
    longitude: 78.5479,
    metadata: { pppoeUser: 'healthcare2', rxPower: -11.48 },
  },
  {
    id: 'onu-2',
    name: 'shekarshop',
    type: 'onu',
    status: 'online',
    latitude: 14.7548,
    longitude: 78.5445,
    metadata: { pppoeUser: 'shekarshop', rxPower: -16.11 },
  },
  {
    id: 'onu-3',
    name: 'ArkComboBox',
    type: 'onu',
    status: 'wire_down',
    latitude: 14.7538,
    longitude: 78.5452,
    metadata: { rxPower: null },
  },
  {
    id: 'onu-4',
    name: 'rrraja',
    type: 'onu',
    status: 'offline',
    latitude: 14.753,
    longitude: 78.544,
    metadata: { rxPower: null },
  },
];
