import React, { useState } from 'react';
import { PageHeader, FilterBar, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { TREE_ROOTS } from '../../data/navigation';

export default function Topology() {
  const [treeRoot, setTreeRoot] = useState('OLT');

  return (
    <div>
      <PageHeader title="Topology View" description="Tree diagram / connection hierarchy view." />

      <FilterBar>
        <div className="w-40">
          <Select label="Select Tree Root" options={TREE_ROOTS} value={treeRoot} onChange={setTreeRoot} />
        </div>
      </FilterBar>

      <EmptyState label={`Hierarchy tree rooted at "${treeRoot}" — recursive tree query arrives in Phase 5.`} />
    </div>
  );
}
