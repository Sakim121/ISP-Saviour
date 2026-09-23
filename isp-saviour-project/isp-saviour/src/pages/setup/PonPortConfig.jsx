import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { PORT_TYPES } from '../../data/navigation';

const DUMMY_OLTS = ['Ark OLT 1', 'Ark OLT 2', 'Nirmal OLT 1'];

export default function PonPortConfig() {
  const [olt, setOlt] = useState('');
  const [portType, setPortType] = useState('');

  return (
    <div>
      <PageHeader title="PON Port Config" description="Configure PON ports per OLT." />

      <FilterBar>
        <div className="w-52">
          <Select label="Select OLT Name" placeholder="Choose OLT" options={DUMMY_OLTS} value={olt} onChange={setOlt} />
        </div>
        <div className="w-40">
          <Select label="Port Type" placeholder="Choose type" options={PORT_TYPES} value={portType} onChange={setPortType} />
        </div>
      </FilterBar>

      <EmptyState label="PON port list/config table arrives with Supabase schema (Phase 3)." />
    </div>
  );
}
