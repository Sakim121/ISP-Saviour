import React, { useState } from 'react';
import { X } from 'lucide-react';
import Select from '../ui/Select';
import {
  PON_PORTS_MAX,
  FIBER_CORE_CAPACITY,
  CORE_COLOR_VARIANTS,
  CABLE_MANUFACTURERS,
} from '../../data/navigation';

const PON_OPTIONS = Array.from({ length: PON_PORTS_MAX }, (_, i) => `PON ${i + 1}`);

/**
 * Shown right after a Polyline is drawn on the map. Captures the `cables`
 * table's metadata columns, PLUS (Phase 5) which two existing nodes this
 * cable actually connects — that from/to link is what lets the Fault
 * Tracing algorithm walk the network as a graph. Everything here is
 * optional: the route geometry alone is enough to save the cable, but a
 * cable with no from/to link can't be included in a fault trace.
 *
 * @param oltOptions  [{label, value}] — existing OLT nodes (for "Source OLT").
 * @param nodeOptions [{label, value}] — ALL existing nodes (for the graph link fields).
 */
export default function AddCableModal({
  open,
  oltOptions = [],
  nodeOptions = [],
  saving = false,
  error = null,
  onCancel,
  onConfirm,
}) {
  const [sourceOltId, setSourceOltId] = useState('');
  const [ponPort, setPonPort] = useState('');
  const [coreCapacity, setCoreCapacity] = useState('');
  const [coreColor, setCoreColor] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [fromNodeId, setFromNodeId] = useState('');
  const [toNodeId, setToNodeId] = useState('');

  if (!open) return null;

  const handleConfirm = () => {
    if (saving) return;
    onConfirm({
      sourceOltId: sourceOltId || null,
      ponPort: ponPort || null,
      coreCapacity: coreCapacity || null,
      coreColor: coreColor || null,
      manufacturer: manufacturer || null,
      fromNodeId: fromNodeId || null,
      toNodeId: toNodeId || null,
    });
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-800">Save Fiber Cable</h3>
          <button onClick={onCancel} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <p className="mb-4 text-xs text-slate-400">
          All fields below are optional — but linking "Connects From/To" is required if you want
          this cable included in Fiber Cut / Fault Tracing.
        </p>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3 rounded-lg border border-brand-100 bg-brand-50/50 p-3">
            <Select label="Connects From (upstream)" placeholder="None" options={nodeOptions} value={fromNodeId} onChange={setFromNodeId} />
            <Select label="Connects To (downstream)" placeholder="None" options={nodeOptions} value={toNodeId} onChange={setToNodeId} />
          </div>

          <Select label="Source OLT" placeholder="None" options={oltOptions} value={sourceOltId} onChange={setSourceOltId} />
          <Select label="Source PON" placeholder="None" options={PON_OPTIONS} value={ponPort} onChange={setPonPort} />
          <Select
            label="Fiber Core Capacity"
            placeholder="None"
            options={FIBER_CORE_CAPACITY}
            value={coreCapacity}
            onChange={setCoreCapacity}
          />
          <Select
            label="Core Color Variant"
            placeholder="None"
            options={CORE_COLOR_VARIANTS}
            value={coreColor}
            onChange={setCoreColor}
          />
          <Select
            label="Cable Manufacturer"
            placeholder="None"
            options={CABLE_MANUFACTURERS}
            value={manufacturer}
            onChange={setManufacturer}
          />
        </div>

        {error && <p className="mt-3 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={saving}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Discard
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Fiber Path'}
          </button>
        </div>
      </div>
    </div>
  );
}
