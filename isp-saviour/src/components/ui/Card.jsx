import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-card ${className}`}>
      {children}
    </div>
  );
}

export function PageHeader({ title, description }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-slate-800">{title}</h1>
      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
    </div>
  );
}

export function FilterBar({ children }) {
  return (
    <Card className="mb-5">
      <div className="flex flex-wrap items-end gap-4">{children}</div>
    </Card>
  );
}

export function EmptyState({ label = 'Not implemented in this phase yet.' }) {
  return (
    <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-400">
      {label}
    </div>
  );
}
