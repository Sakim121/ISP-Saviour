import React, { useState } from 'react';
import { PageHeader, FilterBar, Card, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { ONU_VIEW_MODES, REFRESH_INTERVALS } from '../../data/navigation';
import { Monitor, Share2, Satellite } from 'lucide-react';

const COUNTERS = [
  { label: 'OLTS', value: 1, icon: Monitor, accent: 'border-t-brand-500' },
  { label: 'PONS', value: 4, icon: Share2, accent: 'border-t-sky-500' },
  { label: 'TOTAL ONUS', value: 142, icon: Satellite, accent: 'border-t-slate-500' },
];

export default function LiveOnuStatus() {
  const [viewMode, setViewMode] = useState('Table');
  const [refreshInterval, setRefreshInterval] = useState('30s');

  return (
    <div>
      <PageHeader title="Live ONU Status" description="Status counter cards and analytics charts." />

      <FilterBar>
        <div className="w-40">
          <Select label="View Mode" options={ONU_VIEW_MODES} value={viewMode} onChange={setViewMode} />
        </div>
        <div className="w-44">
          <Select
            label="Refresh Interval"
            options={REFRESH_INTERVALS}
            value={refreshInterval}
            onChange={setRefreshInterval}
          />
        </div>
      </FilterBar>

      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {COUNTERS.map(({ label, value, icon: Icon, accent }) => (
          <Card key={label} className={`border-t-4 ${accent} text-center`}>
            <Icon className="mx-auto mb-2 text-slate-700" size={32} />
            <p className="text-3xl font-bold text-slate-800">{value}</p>
            <p className="text-xs font-medium tracking-wide text-slate-400">{label}</p>
          </Card>
        ))}
      </div>

      <EmptyState label={`Analytics chart (${viewMode} view, ${refreshInterval} refresh) — data wiring arrives in later phases.`} />
    </div>
  );
}
