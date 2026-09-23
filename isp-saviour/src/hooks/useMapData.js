import { useCallback, useEffect, useState } from 'react';
import { fetchMapData, subscribeToRealtimeChanges } from '../lib/mapApi';
import { DUMMY_NODES } from '../data/dummyMapData';

/**
 * Loads nodes + cables from Supabase, keeps them live via realtime, and
 * exposes loading/error state. If Supabase isn't configured yet (missing
 * .env values) or the query fails, falls back to the Phase 2 seed data so
 * the map is still testable without a live backend — `usingFallbackData`
 * tells the UI to show a "Demo Mode" notice in that case.
 */
export default function useMapData() {
  const [nodes, setNodes] = useState([]);
  const [cables, setCables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallbackData, setUsingFallbackData] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { nodes: fetchedNodes, cables: fetchedCables } = await fetchMapData();

      if (fetchedNodes.length === 0 && fetchedCables.length === 0) {
        // An empty (but reachable) Supabase project — most likely the
        // schema was just applied and nothing has been added yet. Seed
        // data keeps the map testable in the meantime.
        setNodes(DUMMY_NODES);
        setCables([]);
        setUsingFallbackData(true);
      } else {
        setNodes(fetchedNodes);
        setCables(fetchedCables);
        setUsingFallbackData(false);
      }
    } catch (err) {
      // Supabase unreachable / not configured / RLS misconfigured, etc.
      console.error('[useMapData] fetchMapData failed, falling back to seed data:', err);
      setError(err);
      setNodes(DUMMY_NODES);
      setCables([]);
      setUsingFallbackData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime subscription — only meaningful once we know we're talking to a
  // real, reachable Supabase project.
  useEffect(() => {
    if (usingFallbackData) return undefined;

    const unsubscribe = subscribeToRealtimeChanges({
      onNodeChange: (payload) => {
        setNodes((prev) => {
          if (payload.eventType === 'DELETE') {
            return prev.filter((n) => n.id !== payload.old.id);
          }
          const idx = prev.findIndex((n) => n.id === payload.new.id);
          if (idx === -1) return [...prev, payload.new];
          const next = [...prev];
          next[idx] = payload.new;
          return next;
        });
      },
    });

    return unsubscribe;
  }, [usingFallbackData]);

  return {
    nodes,
    cables,
    loading,
    error,
    usingFallbackData,
    setNodes,
    setCables,
    refetch: load,
  };
}
