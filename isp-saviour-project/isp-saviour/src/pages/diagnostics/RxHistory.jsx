import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { RX_TIMELINES } from '../../data/navigation';

export default function RxHistory() {
  const [customer, setCustomer] = useState('');
  const [timeline, setTimeline] = useState('24 Hours');

  return (
    <div>
      <PageHeader title="RX History Reports" description="Historical optical power for a specific customer." />

      <FilterBar>
        <label className="flex w-64 flex-col gap-1 text-sm">
          <span className="font-medium text-slate-600">Select Customer Search</span>
          <input
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            placeholder="Type customer / ONU name..."
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
          />
        </label>
        <div className="w-40">
          <Select label="Timeline" options={RX_TIMELINES} value={timeline} onChange={setTimeline} />
        </div>
      </FilterBar>

      <EmptyState label="RX history line chart arrives once historical readings are stored (Phase 3/6)." />
    </div>
  );
}
