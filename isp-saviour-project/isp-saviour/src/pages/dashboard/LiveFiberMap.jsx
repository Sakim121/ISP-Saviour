import React, { useMemo, useState } from 'react';
import { PageHeader, FilterBar } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { PON_PORTS_MAX, MAP_STATUS_FILTERS } from '../../data/navigation';
import LiveMapView from '../../components/map/LiveMapView';

// Placeholder OLT list — will come from Supabase `nodes`/`olts` table in Phase 3.
const DUMMY_OLTS = ['Ark OLT 1', 'Ark OLT 2', 'Nirmal OLT 1'];

export default function LiveFiberMap() {
  const [olt, setOlt] = useState('');
  const [pon, setPon] = useState('');
  const [status, setStatus] = useState('All');

  // PON options depend on the selected OLT (spec requirement).
  const ponOptions = useMemo(() => {
    if (!olt) return [];
    return Array.from({ length: PON_PORTS_MAX }, (_, i) => `PON ${i + 1}`);
  }, [olt]);

  return (
    <div>
      <PageHeader
        title="Live Fiber Map"
        description="Interactive map canvas with OLT / PON / status filters."
      />

      <FilterBar>
        <div className="w-52">
          <Select
            label="Select OLT"
            placeholder="Choose OLT"
            options={DUMMY_OLTS}
            value={olt}
            onChange={(v) => {
              setOlt(v);
              setPon('');
            }}
          />
        </div>
        <div className="w-44">
          <Select
            label="Select PON Port"
            placeholder={olt ? 'Choose PON' : 'Select OLT first'}
            options={ponOptions}
            value={pon}
            onChange={setPon}
            disabled={!olt}
          />
        </div>
        <div className="w-48">
          <Select label="Status Filter" options={MAP_STATUS_FILTERS} value={status} onChange={setStatus} />
        </div>
      </FilterBar>

      {/* Interactive Map Canvas + Map Control Overlays */}
      <LiveMapView statusFilter={status} />
    </div>
  );
}
