import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { LOG_TYPES, DATE_RANGES } from '../../data/navigation';

export default function Logs() {
  const [logType, setLogType] = useState('System');
  const [dateRange, setDateRange] = useState('Today');

  return (
    <div>
      <PageHeader title="Telegram & System Logs" description="Filter alerts and system activity." />

      <FilterBar>
        <div className="w-48">
          <Select label="Log Type" options={LOG_TYPES} value={logType} onChange={setLogType} />
        </div>
        <div className="w-44">
          <Select label="Date Range" options={DATE_RANGES} value={dateRange} onChange={setDateRange} />
        </div>
      </FilterBar>

      <EmptyState label={`Showing "${logType}" logs for "${dateRange}" — log table arrives with Supabase integration (Phase 3/4).`} />
    </div>
  );
}
