import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { RX_SIGNAL_STATUS, RX_SORT_BY } from '../../data/navigation';

export default function RxPower() {
  const [signalStatus, setSignalStatus] = useState('');
  const [sortBy, setSortBy] = useState('Highest Signal');

  return (
    <div>
      <PageHeader title="RX Power Analytics" description="Filter and sort ONUs by optical signal strength." />

      <FilterBar>
        <div className="w-64">
          <Select
            label="Signal Status Filter"
            placeholder="All statuses"
            options={RX_SIGNAL_STATUS}
            value={signalStatus}
            onChange={setSignalStatus}
          />
        </div>
        <div className="w-48">
          <Select label="Sort By" options={RX_SORT_BY} value={sortBy} onChange={setSortBy} />
        </div>
      </FilterBar>

      <EmptyState label="RX power table/chart is populated once the Node.js SNMP scanner (Phase 6/7) is syncing data." />
    </div>
  );
}
