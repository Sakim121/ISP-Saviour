import React, { useState } from 'react';
import { X } from 'lucide-react';

const NODE_TYPES = [
  { value: 'olt', label: 'OLT' },
  { value: 'splitter', label: 'Splitter' },
  { value: 'onu', label: 'ONU' },
];

/**
 * Shown right after a Marker is drawn on the map. A raw Leaflet marker has
 * no name/type/status yet, and the `nodes` table requires all three — this
 * modal captures them before the marker is committed to state/Supabase.
 */
export default function AddNodeModal({ open, coords, saving = false, error = null, onCancel, onConfirm }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('onu');

  if (!open) return null;

  const handleConfirm = () => {
    if (!name.trim() || saving) return;
    onConfirm({ name: name.trim(), type, status: 'online' });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Add / Assign Node</h3>
          <button onClick={onCancel} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Node Name</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="e.g. healthcare2"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">Node Type</span>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            >
              {NODE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          {coords && (
            <p className="text-xs text-slate-400">
              📍 {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
            </p>
          )}

          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}
