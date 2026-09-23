import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { RADIUS_PROVIDERS } from '../../data/navigation';

export default function RadiusServerSync() {
  const [provider, setProvider] = useState('');

  return (
    <div>
      <PageHeader title="Radius Server Sync" description="Connect and sync with your Radius provider." />

      <FilterBar>
        <div className="w-56">
          <Select
            label="Radius Provider Type"
            placeholder="Choose provider"
            options={RADIUS_PROVIDERS}
            value={provider}
            onChange={setProvider}
          />
        </div>
      </FilterBar>

      <EmptyState label={provider ? `Sync configuration for "${provider}" arrives in a later phase.` : 'Select a provider to configure sync.'} />
    </div>
  );
}
