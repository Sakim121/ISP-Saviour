import React, { useMemo, useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import {
  PON_PORTS_MAX,
  FIBER_CORE_CAPACITY,
  CORE_COLOR_VARIANTS,
  CABLE_MANUFACTURERS,
} from '../../data/navigation';

const DUMMY_OLTS = ['Ark OLT 1', 'Ark OLT 2', 'Nirmal OLT 1'];

export default function FiberPath() {
  const [olt, setOlt] = useState('');
  const [pon, setPon] = useState('');
  const [coreCapacity, setCoreCapacity] = useState('');
  const [coreColor, setCoreColor] = useState('');
  const [manufacturer, setManufacturer] = useState('');

  const ponOptions = useMemo(
    () => (olt ? Array.from({ length: PON_PORTS_MAX }, (_, i) => `PON ${i + 1}`) : []),
    [olt]
  );

  return (
    <div>
      <PageHeader title="Fiber Path / Route" description="Polyline drawing tools on the map layer." />

      <FilterBar>
        <div className="w-48">
          <Select label="Source OLT" placeholder="Choose OLT" options={DUMMY_OLTS} value={olt} onChange={(v) => { setOlt(v); setPon(''); }} />
        </div>
        <div className="w-40">
          <Select label="Source PON" placeholder={olt ? 'Choose PON' : 'Select OLT first'} options={ponOptions} value={pon} onChange={setPon} disabled={!olt} />
        </div>
        <div className="w-44">
          <Select label="Fiber Core Capacity" placeholder="Select capacity" options={FIBER_CORE_CAPACITY} value={coreCapacity} onChange={setCoreCapacity} />
        </div>
        <div className="w-44">
          <Select label="Core Color Variant" placeholder="Select color" options={CORE_COLOR_VARIANTS} value={coreColor} onChange={setCoreColor} />
        </div>
        <div className="w-44">
          <Select label="Cable Manufacturer" placeholder="Select manufacturer" options={CABLE_MANUFACTURERS} value={manufacturer} onChange={setManufacturer} />
        </div>
      </FilterBar>

      <EmptyState label="Polyline drawing canvas (Leaflet-Geoman) arrives in Phase 2." />
    </div>
  );
}
