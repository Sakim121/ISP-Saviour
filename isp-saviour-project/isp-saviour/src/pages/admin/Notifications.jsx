import React, { useEffect, useState } from 'react';
import { AlertTriangle, Check, Loader2 } from 'lucide-react';
import { PageHeader, FilterBar, Card } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { ALERT_CHANNELS, EVENT_TRIGGERS } from '../../data/navigation';
import { fetchNotificationPreference, updateNotificationPreference } from '../../lib/notificationApi';

// Phase 4 spec's exact wording for this toggle (kept verbatim — do not
// rename to match Phase 1's differently-worded "Event Trigger" dropdown
// above; see the file-level note in supabase/migrations/0003_notification_
// settings.sql for why these are two intentionally separate controls).
const PREFERENCE_OPTIONS = [
  {
    value: 'all_logs',
    label: 'Send all logs',
    description: 'Every offline/wire-down status change sends a Telegram alert.',
  },
  {
    value: 'only_wire_down',
    label: 'Only Wire Down',
    description: 'Only "wire_down" events trigger an alert.',
  },
  {
    value: 'muted',
    label: 'Mute Notifications',
    description: 'No Telegram alerts are sent, regardless of status changes.',
  },
];

export default function Notifications() {
  // --- Phase 1 fields (unchanged, not yet wired to a backend) ---
  const [channel, setChannel] = useState('Telegram Bot');
  const [trigger, setTrigger] = useState('Only Wire Down');

  // --- Phase 4 functional preference (Supabase-backed) ---
  const [row, setRow] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchNotificationPreference();
        if (!data) {
          setDemoMode(true);
          setRow({ id: null, preference: 'only_wire_down' });
        } else {
          setRow(data);
        }
      } catch (err) {
        console.error(err);
        setDemoMode(true);
        setError('Could not reach Supabase — this control will not persist until it is connected.');
        setRow({ id: null, preference: 'only_wire_down' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSelectPreference = async (value) => {
    if (!row || saving || row.preference === value) return;

    const previous = row.preference;
    setSaving(true);
    setError(null);
    setRow((r) => ({ ...r, preference: value })); // optimistic update

    if (demoMode || !row.id) {
      setSaving(false);
      return; // nothing to persist in demo mode
    }

    try {
      await updateNotificationPreference(row.id, value);
    } catch (err) {
      setRow((r) => ({ ...r, preference: previous })); // revert on failure
      setError(err.message ?? 'Failed to save preference.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader title="Notification Settings" description="Choose how and when alerts are sent." />

      <FilterBar>
        <div className="w-48">
          <Select label="Alert Channels" options={ALERT_CHANNELS} value={channel} onChange={setChannel} />
        </div>
        <div className="w-56">
          <Select label="Event Trigger" options={EVENT_TRIGGERS} value={trigger} onChange={setTrigger} />
        </div>
      </FilterBar>
      <p className="-mt-2 mb-5 text-xs text-slate-400">
        The two dropdowns above are the Phase 1 navigation spec's fields and aren't wired to a
        backend yet. The panel below is the Phase 4 functional control — it's what the Supabase
        trigger actually reads before sending a Telegram alert.
      </p>

      <Card>
        <h3 className="mb-1 text-sm font-bold text-slate-700">Active Notification Preference</h3>
        <p className="mb-4 text-xs text-slate-400">
          Stored in the <code className="rounded bg-slate-100 px-1 py-0.5">notification_settings</code> table.
        </p>

        {loading ? (
          <div className="flex items-center gap-2 py-4 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Loading...
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            {PREFERENCE_OPTIONS.map((opt) => {
              const active = row?.preference === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelectPreference(opt.value)}
                  disabled={saving}
                  className={`flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition disabled:opacity-60 ${
                    active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    {active && <Check size={14} className="text-brand-600" />}
                    {opt.label}
                  </span>
                  <span className="text-xs text-slate-500">{opt.description}</span>
                </button>
              );
            })}
          </div>
        )}

        {demoMode && (
          <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-amber-600">
            <AlertTriangle size={13} />
            Demo Mode — connect Supabase and run the Phase 4 migrations to persist this choice.
          </p>
        )}
        {error && !demoMode && <p className="mt-3 text-xs text-red-500">{error}</p>}
      </Card>
    </div>
  );
}
