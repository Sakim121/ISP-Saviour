import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';

const DUMMY_OLT_DESCRIPTIONS = ['Ark OLT 1 - Main Rd', 'Ark OLT 2 - HB Colony'];
const DUMMY_ANCHORS = ['SEH Beside Pole (Jointbox)', 'TJ-12 Korrapadu Rd'];

export default function OnuBind() {
  const [oltDesc, setOltDesc] = useState('');
  const [pppoeUser, setPppoeUser] = useState('');
  const [anchor, setAnchor] = useState('');

  return (
    <div>
      <PageHeader title="ONU Mapping" description="Bind a physical ONU to its OLT, PPPoE user, and anchor point." />

      <FilterBar>
        <div className="w-56">
          <Select label="Select OLT Description" placeholder="Choose OLT" options={DUMMY_OLT_DESCRIPTIONS} value={oltDesc} onChange={setOltDesc} />
        </div>
        <label className="flex w-56 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">PPPoE Username</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Type or search username..."
            value={pppoeUser}
            onChange={(e) => setPppoeUser(e.target.value)}
          />
        </label>
        <div className="w-64">
          <Select
            label="Connected Box/Splitter Anchor"
            placeholder="Choose anchor"
            options={DUMMY_ANCHORS}
            value={anchor}
            onChange={setAnchor}
          />
        </div>
      </FilterBar>

      <EmptyState label="Map-based ONU pin placement arrives in Phase 2." />
    </div>
  );
}
