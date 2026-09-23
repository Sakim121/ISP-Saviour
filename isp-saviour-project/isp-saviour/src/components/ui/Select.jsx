import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * Reusable labeled dropdown.
 * options: array of strings, OR array of {label, value}
 */
export default function Select({ label, options = [], value, onChange, placeholder, disabled }) {
  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { label: opt, value: opt } : opt
  );

  return (
    <label className="flex flex-col gap-1 text-sm">
      {label && <span className="font-medium text-slate-600">{label}</span>}
      <div className="relative">
        <select
          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-700 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          value={value ?? ''}
          onChange={(e) => onChange?.(e.target.value)}
          disabled={disabled}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {normalized.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
      </div>
    </label>
  );
}
