import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Server,
  MapPin,
  Activity,
  Settings,
  ChevronDown,
  Network,
  X,
} from 'lucide-react';
import { navigation } from '../../data/navigation';

// Map string icon names (from navigation.js) to actual lucide components.
const ICONS = {
  LayoutDashboard,
  Server,
  MapPin,
  Activity,
  Settings,
};

function GroupIcon({ name, ...props }) {
  const Icon = ICONS[name] ?? LayoutDashboard;
  return <Icon {...props} />;
}

export default function Sidebar({ open, onClose }) {
  const location = useLocation();

  // A group is "open" if the user expanded it OR the current route is inside it.
  const [openGroups, setOpenGroups] = useState(() =>
    Object.fromEntries(
      navigation.map((group) => [
        group.id,
        group.items.some((item) => location.pathname.startsWith(item.path)),
      ])
    )
  );

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Network size={18} />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight text-slate-800">ISP SAVIOUR</p>
              <p className="text-[11px] leading-tight text-slate-400">Fiber Network Control</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
          >
            <X size={18} />
          </button>
        </div>

        {/* Nav groups */}
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navigation.map((group) => {
            const isOpen = openGroups[group.id];
            const isGroupActive = group.items.some((item) =>
              location.pathname.startsWith(item.path)
            );

            return (
              <div key={group.id} className="mb-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                    isGroupActive
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <GroupIcon name={group.icon} size={18} />
                    {group.label}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <div
                  className={`grid overflow-hidden transition-all duration-200 ${
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                  }`}
                >
                  <div className="min-h-0">
                    <ul className="ml-4 mt-1 space-y-0.5 border-l border-slate-100 pl-4">
                      {group.items.map((item) => (
                        <li key={item.path}>
                          <NavLink
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                              `block rounded-md px-3 py-2 text-sm transition ${
                                isActive
                                  ? 'bg-brand-600 text-white shadow-sm'
                                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                              }`
                            }
                          >
                            {item.name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-400">
          ISP Saviour v0.1 · Phase 1
        </div>
      </aside>
    </>
  );
}
