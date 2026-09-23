import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, Zap, AlertTriangle } from 'lucide-react';
import { PageHeader, Card } from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import { fetchOutageCandidates, traceFiberFault } from '../../lib/faultApi';
import FaultMap from '../../components/map/FaultMap';
import FaultSidebar from '../../components/map/FaultSidebar';

// NOTE ON THIS PAGE'S DROPDOWNS:
// The Phase 1 spec named this page's two controls ("Select Down Zone",
// "Outage Cluster") but did not specify fixed option values for them (unlike
// most other dropdowns in the brief, which listed exact bullet options).
// Now that real outage data exists (Phase 3+), these are populated live from
// currently-down ONUs rather than left as placeholder text — "Down Zone" is
// a PON grouping, "Outage Cluster" is the resulting group of affected ONUs
// under it, shown as a selectable checklist.

export default function FaultTracer() {
  const [outageNodes, setOutageNodes] = useState([]);
  const [loadingNodes, setLoadingNodes] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [zone, setZone] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const [tracing, setTracing] = useState(false);
  const [traceError, setTraceError] = useState(null);
  const [faultResult, setFaultResult] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchOutageCandidates();
        setOutageNodes(data);
      } catch (err) {
        console.error(err);
        setLoadError('Could not reach Supabase — connect it to see live outages here.');
      } finally {
        setLoadingNodes(false);
      }
    })();
  }, []);

  const zones = useMemo(() => {
    const set = new Set(outageNodes.map((n) => n.metadata?.pon_port ?? 'Unclustered'));
    return Array.from(set);
  }, [outageNodes]);

  const cluster = useMemo(
    () => outageNodes.filter((n) => (n.metadata?.pon_port ?? 'Unclustered') === zone),
    [outageNodes, zone]
  );

  useEffect(() => {
    setSelectedIds(cluster.map((n) => n.id)); // default: everyone in the zone is selected
    setFaultResult(null);
  }, [cluster]);

  const toggleSelected = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runTrace = async () => {
    if (selectedIds.length === 0) return;
    setTracing(true);
    setTraceError(null);
    setFaultResult(null);
    try {
      const result = await traceFiberFault(selectedIds);
      setFaultResult(result);
    } catch (err) {
      setTraceError(err.message ?? 'Fault trace failed.');
    } finally {
      setTracing(false);
    }
  };

  const affectedNodesForMap = outageNodes.filter((n) => selectedIds.includes(n.id));

  return (
    <div>
      <PageHeader
        title="Fiber Cut Tracing Tool"
        description="Select the affected outage cluster and localize the probable cable break."
      />

      {loadingNodes ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 size={16} className="animate-spin" /> Loading current outages...
        </div>
      ) : loadError ? (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <AlertTriangle size={16} /> {loadError}
        </div>
      ) : outageNodes.length === 0 ? (
        <Card>
          <p className="text-sm text-slate-500">No ONUs are currently offline or wire-down. 🎉</p>
        </Card>
      ) : (
        <>
          <Card className="mb-5">
            <div className="flex flex-wrap items-end gap-4">
              <div className="w-56">
                <Select
                  label="Select Down Zone"
                  placeholder="Choose zone"
                  options={zones}
                  value={zone}
                  onChange={setZone}
                />
              </div>
              <button
                onClick={runTrace}
                disabled={!zone || selectedIds.length === 0 || tracing}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {tracing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />}
                {tracing ? 'Tracing...' : 'Run Fault Trace'}
              </button>
            </div>

            {zone && (
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Outage Cluster — {cluster.length} ONU{cluster.length === 1 ? '' : 's'} down
                </p>
                <div className="flex flex-wrap gap-2">
                  {cluster.map((n) => (
                    <label
                      key={n.id}
                      className="flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1 text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(n.id)}
                        onChange={() => toggleSelected(n.id)}
                        className="h-3 w-3 accent-red-600"
                      />
                      {n.name}
                      <span
                        className={`ml-1 rounded-full px-1.5 text-[10px] font-medium ${
                          n.status === 'wire_down' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {n.status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {traceError && <p className="mt-3 text-xs text-red-500">{traceError}</p>}
          </Card>

          {faultResult && (
            <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
              <FaultMap affectedNodes={affectedNodesForMap} faultResult={faultResult} />
              <FaultSidebar faultResult={faultResult} affectedCount={selectedIds.length} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
