// ============================================================================
// ISP SAVIOUR — NAVIGATION CONFIG
// This file is the SINGLE SOURCE OF TRUTH for the sidebar.
// Routes, icon names, and sub-menu labels below are taken EXACTLY from the
// Phase 1 specification. Do not add/remove items here without updating spec.
// ============================================================================

export const navigation = [
  {
    id: 'monitoring',
    label: 'Dashboard & Monitoring',
    icon: 'LayoutDashboard',
    items: [
      { name: 'Live Fiber Map', path: '/dashboard/map' },
      { name: 'Live ONU Status', path: '/dashboard/onu-status' },
      { name: 'Telegram & System Logs', path: '/dashboard/logs' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure Setup',
    icon: 'Server',
    items: [
      { name: 'OLT Management', path: '/setup/olt' },
      { name: 'PON Port Config', path: '/setup/pon-ports' },
      { name: 'Radius Server Sync', path: '/setup/radius' },
    ],
  },
  {
    id: 'mapping',
    label: 'Network Drawing & Mapping',
    icon: 'MapPin',
    items: [
      { name: 'Fiber Path / Route', path: '/mapping/fiber-path' },
      { name: 'Junction & Splitter Setup', path: '/mapping/splitters' },
      { name: 'ONU Mapping', path: '/mapping/onu-bind' },
    ],
  },
  {
    id: 'diagnostics',
    label: 'Diagnostics & Analytics',
    icon: 'Activity',
    items: [
      { name: 'RX Power Analytics', path: '/diagnostics/rx-power' },
      { name: 'RX History Reports', path: '/diagnostics/rx-history' },
      { name: 'Topology View', path: '/diagnostics/topology' },
    ],
  },
  {
    id: 'admin',
    label: 'System Tools & Admin',
    icon: 'Settings',
    items: [
      { name: 'Fiber Cut Tracing Tool', path: '/admin/fault-tracer' },
      { name: 'User Management', path: '/admin/users' },
      { name: 'Notification Settings', path: '/admin/notifications' },
    ],
  },
];

// ----------------------------------------------------------------------------
// DROPDOWN OPTION SETS — exactly as specified per page. Imported by the page
// components below so option lists live in one place and stay consistent.
// ----------------------------------------------------------------------------

export const OLT_BRANDS = ['Netlink', 'Syrotech', 'VSOL', 'Huawei', 'ZTE', 'Cisco', 'Generic'];
export const SNMP_VERSIONS = ['v1', 'v2c', 'v3'];
export const OLT_STATUS = ['Active', 'Inactive'];

export const PON_PORTS_MAX = 16; // PON 1 ... PON 16
export const PORT_TYPES = ['EPON', 'GPON', 'XG-PON'];

export const RADIUS_PROVIDERS = ['MikroTik User Manager', 'Splynx', 'LogRadius', 'Custom API'];

export const MAP_STATUS_FILTERS = ['All', 'Online', 'Offline', 'Power Off', 'Wire Down'];

export const ONU_VIEW_MODES = ['Chart', 'Table', 'Grid'];
export const REFRESH_INTERVALS = ['Real-time', '30s', '1m', '5m'];

export const LOG_TYPES = ['Fiber Cut', 'ONU Power Down', 'System'];
export const DATE_RANGES = ['Today', 'Yesterday', 'Last 7 Days', 'Custom'];

export const FIBER_CORE_CAPACITY = ['2', '4', '6', '12', '24', '48', '96 Core'];
export const CORE_COLOR_VARIANTS = [
  'Blue',
  'Orange',
  'Green',
  'Brown',
  'Slate',
  'White',
  'Red',
  'Black',
  'Yellow',
  'Violet',
  'Rose',
  'Aqua',
];
export const CABLE_MANUFACTURERS = ['BRB', 'Poly', 'Sterlite', 'Finolex', 'Generic'];

export const JUNCTION_DEVICE_TYPES = ['TJ Box', 'Splitter Box'];
export const SPLITTER_RATIOS = ['1:2', '1:4', '1:8', '1:16', '1:32', '1:64'];
export const COUPLER_RATIOS = ['90/10', '80/20', '70/30', '50/50'];

export const RX_SIGNAL_STATUS = [
  'Good: -15 to -23 dBm',
  'Warning: -24 to -27 dBm',
  'Critical: -28 dBm or worse',
];
export const RX_SORT_BY = ['Highest Signal', 'Lowest Signal', 'Alphabetical'];
export const RX_TIMELINES = ['24 Hours', '7 Days', '30 Days'];

export const TREE_ROOTS = ['OLT', 'PON Port'];

export const USER_ROLES = ['Super Admin', 'Admin', 'Support Staff', 'Field Technician', 'Viewer'];

export const ALERT_CHANNELS = ['Telegram Bot', 'SMS Gateway', 'Web Push'];
export const EVENT_TRIGGERS = ['Only Wire Down', 'Power Off & Wire Down', 'All Events'];
