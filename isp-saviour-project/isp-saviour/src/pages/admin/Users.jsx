import React, { useState } from 'react';
import { PageHeader, FilterBar, Card, EmptyState } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { USER_ROLES } from '../../data/navigation';

const DUMMY_USERS = [
  { name: 'admin', role: 'Super Admin' },
  { name: 'field.tech1', role: 'Field Technician' },
];

export default function Users() {
  const [roleFilter, setRoleFilter] = useState('');

  return (
    <div>
      <PageHeader title="User Management" description="Manage staff accounts and role permissions." />

      <FilterBar>
        <div className="w-56">
          <Select
            label="User Role Permission"
            placeholder="Filter by role"
            options={USER_ROLES}
            value={roleFilter}
            onChange={setRoleFilter}
          />
        </div>
      </FilterBar>

      <Card>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400">
              <th className="py-2">Name</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {DUMMY_USERS.filter((u) => !roleFilter || u.role === roleFilter).map((u) => (
              <tr key={u.name} className="border-b border-slate-50 last:border-0">
                <td className="py-2.5 font-medium text-slate-700">{u.name}</td>
                <td className="text-slate-500">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-5">
        <EmptyState label="Auth + Supabase-backed user table arrives in a later phase." />
      </div>
    </div>
  );
}
