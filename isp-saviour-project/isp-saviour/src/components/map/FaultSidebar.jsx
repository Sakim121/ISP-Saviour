import React from 'react';
import { Users, Radio, Ruler, Info } from 'lucide-react';
import { Card } from '../ui/Card';

export default function FaultSidebar({ faultResult, affectedCount }) {
  if (!faultResult) {
    return (
      <Card>
        <p className="text-sm text-slate-400">Run a fault trace to see results here.</p>
      </Card>
    );
  }

  const items = [
    { icon: Radio, label: 'Affected PON Port', value: faultResult.affected_pon_port ?? 'Unknown' },
    { icon: Users, label: 'Number of Down Users', value: affectedCount ?? faultResult.affected_count ?? '—' },
    {
      icon: Ruler,
      label: 'Estimated Distance from OLT',
      value:
        faultResult.distance_from_olt_m != null
          ? `${Math.round(faultResult.distance_from_olt_m)} m`
          : 'Unknown',
    },
  ];

  return (
    <Card>
      <h3 className="mb-3 text-sm font-bold text-slate-700">Fault Information</h3>
      <div className="space-y-3">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-500">
              <Icon size={16} />
            </div>
            <div>
              <p className="text-xs text-slate-400">{label}</p>
              <p className="text-sm font-semibold text-slate-700">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {faultResult.note && (
        <div className="mt-4 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <Info size={14} className="mt-0.5 shrink-0" />
          <span>{faultResult.note}</span>
        </div>
      )}
    </Card>
  );
}
