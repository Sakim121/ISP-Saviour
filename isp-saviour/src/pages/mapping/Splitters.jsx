import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { JUNCTION_DEVICE_TYPES, SPLITTER_RATIOS, COUPLER_RATIOS } from '../../data/navigation';

export default function Splitters() {
  const [deviceType, setDeviceType] = useState('');
  const [splitterRatio, setSplitterRatio] = useState('');
  const [couplerRatio, setCouplerRatio] = useState('');

  return (
    <div>
      <PageHeader title="Junction & Splitter Setup" description="Place and configure TJ boxes / splitter boxes." />

      <FilterBar>
        <div className="w-40">
          <Select label="Device Type" placeholder="Select type" options={JUNCTION_DEVICE_TYPES} value={deviceType} onChange={setDeviceType} />
        </div>
        <div className="w-40">
          <Select label="Splitter Ratio" placeholder="Select ratio" options={SPLITTER_RATIOS} value={splitterRatio} onChange={setSplitterRatio} />
        </div>
        <div className="w-40">
          <Select label="Coupler Ratio" placeholder="Select ratio" options={COUPLER_RATIOS} value={couplerRatio} onChange={setCouplerRatio} />
        </div>
      </FilterBar>

      <EmptyState label="Map placement of junction/splitter devices arrives in Phase 2." />
    </div>
  );
}
