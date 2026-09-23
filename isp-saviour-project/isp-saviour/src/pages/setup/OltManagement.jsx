import React, { useState } from 'react';
import { PageHeader, Card, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { OLT_BRANDS, SNMP_VERSIONS, OLT_STATUS } from '../../data/navigation';
import { Plus, X } from 'lucide-react';

const DUMMY_OLTS = [
  { name: 'Ark OLT 1', brand: 'VSOL', ip: '192.168.80.2', snmp: 'v2c', status: 'Active' },
];

function AddOltModal({ open, onClose }) {
  const [brand, setBrand] = useState('');
  const [snmp, setSnmp] = useState('');
  const [status, setStatus] = useState('Active');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Add New OLT</h2>
          <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">OLT Name</span>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="e.g. Ark OLT 1"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-600">IP Address</span>
            <input
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="192.168.80.2"
            />
          </label>
          <Select label="OLT Brand" placeholder="Select brand" options={OLT_BRANDS} value={brand} onChange={setBrand} />
          <Select label="SNMP Version" placeholder="Select version" options={SNMP_VERSIONS} value={snmp} onChange={setSnmp} />
          <Select label="Status" options={OLT_STATUS} value={status} onChange={setStatus} />
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={onClose} className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700">
            Save OLT
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OltManagement() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div>
      <PageHeader title="OLT Management" description="Manage physical OLT devices." />

      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700"
        >
          <Plus size={16} /> Add New OLT
        </button>
      </div>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Name</th>
              <th>Brand</th>
              <th>IP</th>
              <th>SNMP</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_OLTS.map((olt) => (
              <tr key={olt.name} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 font-medium text-slate-700">{olt.name}</td>
                <td className="text-slate-500">{olt.brand}</td>
                <td className="text-slate-500">{olt.ip}</td>
                <td className="text-slate-500">{olt.snmp}</td>
                <td>
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-600">
                    {olt.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-5">
        <EmptyState label="Full CRUD + Supabase persistence arrives in Phase 3." />
      </div>

      <AddOltModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
