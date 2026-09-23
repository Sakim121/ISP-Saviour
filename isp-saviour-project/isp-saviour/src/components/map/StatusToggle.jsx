import React from 'react';

// Sidebar toggle/filter connected to map state — spec section "MAP STATUS FILTER".
const STATUS_OPTIONS = [
  { key: 'online', label: 'Online', dotClass: 'bg-emerald-500' },
  { key: 'offline', label: 'Offline', dotClass: 'bg-red-500' },
  { key: 'wire_down', label: 'Wire Down', dotClass: 'bg-yellow-500' },
];

export default function StatusToggle({ visibleStatuses, onChange }) {
  const toggle = (key) => {
    onChange({ ...visibleStatuses, [key]: !visibleStatuses[key] });
  };

  return (
    <div className="absolute bottom-3 left-3 z-[1000] flex items-center gap-4 rounded-lg border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-card backdrop-blur">
      <span className="font-semibold text-slate-500">Show:</span>
      {STATUS_OPTIONS.map((opt) => (
        <label key={opt.key} className="flex cursor-pointer select-none items-center gap-1.5">
          <input
            type="checkbox"
            checked={visibleStatuses[opt.key]}
            onChange={() => toggle(opt.key)}
            className="h-3.5 w-3.5 accent-brand-600"
          />
          <span className={`h-2.5 w-2.5 rounded-full ${opt.dotClass}`} />
          <span className="text-slate-600">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}
