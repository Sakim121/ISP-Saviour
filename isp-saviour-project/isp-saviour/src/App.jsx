import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import Login from './pages/Login';

// Dashboard & Monitoring
import LiveFiberMap from './pages/dashboard/LiveFiberMap';
import LiveOnuStatus from './pages/dashboard/LiveOnuStatus';
import Logs from './pages/dashboard/Logs';

// Infrastructure Setup
import OltManagement from './pages/setup/OltManagement';
import PonPortConfig from './pages/setup/PonPortConfig';
import RadiusServerSync from './pages/setup/RadiusServerSync';

// Network Drawing & Mapping
import FiberPath from './pages/mapping/FiberPath';
import Splitters from './pages/mapping/Splitters';
import OnuBind from './pages/mapping/OnuBind';

// Diagnostics & Analytics
import RxPower from './pages/diagnostics/RxPower';
import RxHistory from './pages/diagnostics/RxHistory';
import Topology from './pages/diagnostics/Topology';

// System Tools & Admin
import FaultTracer from './pages/admin/FaultTracer';
import Users from './pages/admin/Users';
import Notifications from './pages/admin/Notifications';

export default function App() {
  return (
    <Routes>
      {/* Sign-in is only needed for write actions (Phase 8 RLS) — reading
          the dashboard/map never requires it, so this route sits outside
          DashboardLayout rather than being a global gate. */}
      <Route path="/login" element={<Login />} />

      <Route element={<DashboardLayout />}>
        {/* Default landing route -> Live Fiber Map */}
        <Route index element={<Navigate to="/dashboard/map" replace />} />

        {/* 1. Dashboard & Monitoring */}
        <Route path="/dashboard/map" element={<LiveFiberMap />} />
        <Route path="/dashboard/onu-status" element={<LiveOnuStatus />} />
        <Route path="/dashboard/logs" element={<Logs />} />

        {/* 2. Infrastructure Setup */}
        <Route path="/setup/olt" element={<OltManagement />} />
        <Route path="/setup/pon-ports" element={<PonPortConfig />} />
        <Route path="/setup/radius" element={<RadiusServerSync />} />

        {/* 3. Network Drawing & Mapping */}
        <Route path="/mapping/fiber-path" element={<FiberPath />} />
        <Route path="/mapping/splitters" element={<Splitters />} />
        <Route path="/mapping/onu-bind" element={<OnuBind />} />

        {/* 4. Diagnostics & Analytics */}
        <Route path="/diagnostics/rx-power" element={<RxPower />} />
        <Route path="/diagnostics/rx-history" element={<RxHistory />} />
        <Route path="/diagnostics/topology" element={<Topology />} />

        {/* 5. System Tools & Admin */}
        <Route path="/admin/fault-tracer" element={<FaultTracer />} />
        <Route path="/admin/users" element={<Users />} />
        <Route path="/admin/notifications" element={<Notifications />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard/map" replace />} />
      </Route>
    </Routes>
  );
}
